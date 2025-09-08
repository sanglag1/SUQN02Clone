import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import {
  getUserListCache,
  setUserListCache,
  getUserUpdateCache,
  getUserCache,
  USER_LIST_CACHE_DURATION
} from "../../../lib/userCache";




export async function GET() {
  try {
    // Check cache first
    const now = Date.now();
    const currentCache = getUserListCache();
    if (currentCache && (now - currentCache.timestamp) < USER_LIST_CACHE_DURATION) {
      return (NextResponse.json(currentCache.data));
    }

    // Select specific fields including activity tracking fields
    const users = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
        status: true,
        lastLogin: true,
        lastActivity: true,
        lastSignInAt: true,
        isOnline: true,
        clerkSessionActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { lastActivity: 'desc' },
        { lastLogin: 'desc' }
      ]
    });

    // Define a type for the user role
    type UserRole = {
      id: string;
      name?: string;
      displayName?: string;
    };

    // Define a type for the user
    type UserType = {
      id: string;
      clerkId: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      avatar: string | null;
      roleId: string;
      role: UserRole | null;
      status: string | null;
      lastLogin: Date | null;
      lastActivity: Date | null;
      lastSignInAt: Date | null;
      isOnline: boolean | null;
      clerkSessionActive: boolean | null;
      createdAt: Date;
      updatedAt: Date;
    };

    // Transform the users to ensure fullName and imageUrl are properly set
    const transformedUsers = users.map((user: UserType) => {
      // Calculate fullName from firstName and lastName
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || null;

      return {
        ...user,
        fullName,
        imageUrl: user.avatar, // Add imageUrl as alias for avatar
        
        role: user.role?.name || user.role?.displayName || 'user' // Backward compatibility: extract role name
      };
    });

    const responseData = {
      success: true,
      users: transformedUsers,
      totalCount: transformedUsers.length
    };

    // Update cache
    setUserListCache(responseData);

    return (NextResponse.json(responseData));
  } catch (error) {
    console.error("Error fetching users:", error);
    return (NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    ));
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, clerkId, avatar } = body;

    if (!email || !clerkId) {
      return (NextResponse.json({ error: "Email and clerkId are required" }, { status: 400 }));
    }

    // Check if user was recently updated (within last hour) to avoid unnecessary updates
    const recentUpdateKey = `user_update_${clerkId}`;
    const userUpdateCache = getUserUpdateCache();
    const lastUpdate = userUpdateCache.get(recentUpdateKey);
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    if (lastUpdate && lastUpdate > oneHourAgo) {
      // Return cached user data if recently updated
      const userCache = getUserCache();
      const cachedUser = userCache.get(clerkId);
      if (cachedUser) {
        return (NextResponse.json({
          message: "User data is current (cached)",
          user: cachedUser,
          action: "cached"
        }));
      }
    }

    // Kiểm tra xem user đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        userPackages: {
          where: { isActive: true },
          include: { servicePackage: true }
        }
      }
    });

    const isNewUser = !existingUser;
    

    // Merge by email to avoid unique constraint conflicts, then ensure clerkId
    let user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      const existingByEmail = await prisma.user.findUnique({ where: { email } }).catch(() => null);
      if (existingByEmail) {
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            clerkId,
            email,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            avatar: avatar || undefined,
            lastLogin: new Date()
          },
          include: {
            role: { select: { id: true, name: true, displayName: true } }
          }
        });
      } else {
        user = await prisma.user.create({
          data: {
            clerkId,
            email,
            firstName: firstName || '',
            lastName: lastName || '',
            avatar: avatar || '',
            lastLogin: new Date(),
            roleId: 'user_role_id'
          },
          include: {
            role: { select: { id: true, name: true, displayName: true } }
          }
        });
      }
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          email,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          avatar: avatar || undefined,
          lastLogin: new Date()
        },
        include: {
          role: { select: { id: true, name: true, displayName: true } }
        }
      });
    }

    // Sử dụng transaction để đảm bảo consistency khi tạo user và gói free
    const result = await prisma.$transaction(async (tx) => {
      // Kiểm tra lại xem user có gói active không
      const userWithPackages = await tx.user.findUnique({
        where: { id: user.id },
        include: {
          userPackages: {
            where: { 
              isActive: true,
              endDate: { gte: new Date() } // Chỉ tính gói còn hạn
            },
            include: { servicePackage: true }
          }
        }
      });

      const hasActivePackage = userWithPackages && userWithPackages.userPackages.length > 0;
   
      // Tạo gói free cho user mới đăng ký hoặc user cũ chưa có gói active
      if (!hasActivePackage) {
        try {
          // Tìm gói free (giá = 0 hoặc tên chứa "free")
          console.log(`Đang tìm gói free cho user ${isNewUser ? 'mới' : 'cũ chưa có gói'}...`);
          const freePackage = await tx.servicePackage.findFirst({
            where: {
              OR: [
                { price: 0 },
                { 
                  name: {
                    contains: 'free',
                    mode: 'insensitive' // Không phân biệt hoa thường
                  }
                }
              ],
              isActive: true
            }
          });


          if (freePackage) {
            // Tạo gói free mới với số lần dùng tương ứng theo gói free
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1); // Gói free có thời hạn 1 năm

            const freeUserPackage = await tx.userPackage.create({
              data: {
                userId: user.id,
                servicePackageId: freePackage.id,
                startDate: new Date(),
                endDate: endDate,
                isActive: true,
                // Set usage counters tương ứng với limit của ServicePackage
                avatarInterviewUsed: freePackage.avatarInterviewLimit,
                testQuizEQUsed: freePackage.testQuizEQLimit,
                jdUploadUsed: freePackage.jdUploadLimit
              }
            });

         
            return { 
              ...user, 
              freePackageAssigned: true, 
              freePackage: {
                ...freeUserPackage,
                servicePackage: freePackage
              }
            };
          } else {
            console.log('❌ Không tìm thấy gói free trong hệ thống');
            console.log(`⚠️ User ${user.email} sẽ không có gói active`);
          }
        } catch (packageError) {
          console.error('❌ Lỗi khi gán gói free:', packageError);
          // Không throw error để không ảnh hưởng đến việc tạo user
        }
      } 
      
      return user;
    });

    // Invalidate cache sau khi tạo user và gói free
    const userCache = getUserCache();
    
    // Clear user cache
    userCache.delete(clerkId);
    
    // Set recent update timestamp
    userUpdateCache.set(recentUpdateKey, Date.now());
    
    // Clear user list cache
    setUserListCache({ success: true, users: [], totalCount: 0 });

    // Define a type for the result object to avoid using 'any'
    type ResultWithRole = typeof user & { role?: { name?: string } };
    // Transform result for backward compatibility
    const transformedResult = {
      ...result,
      role: ((result as ResultWithRole)?.role?.name) || 'user'
    };

    return (NextResponse.json(transformedResult));
  } catch (error) {
    console.error("Error in user API:", error);
    return (NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    ));
  }
}
