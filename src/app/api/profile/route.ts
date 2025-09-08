import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Try multiple approaches to get user
    let userId = null;
    let clerkUser = null;
    
    try {
      const { userId: authUserId } = await auth();
      userId = authUserId;
    } catch {}

    try {
      clerkUser = await currentUser();
      if (clerkUser && !userId) {
        userId = clerkUser.id;
      }
    } catch {}

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No user ID found from Clerk authentication' }, 
        { status: 401 }
      );
    }

    // Merge by email first to avoid unique conflicts, then ensure clerkId
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress || "";
    let user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      const existingByEmail = email ? await prisma.user.findUnique({ where: { email } }).catch(() => null) : null;
      if (existingByEmail) {
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            clerkId: userId,
            lastLogin: new Date(),
            email: email || existingByEmail.email,
            firstName: existingByEmail.firstName ?? clerkUser?.firstName ?? undefined,
            lastName: existingByEmail.lastName ?? clerkUser?.lastName ?? undefined,
            avatar: existingByEmail.avatar ?? clerkUser?.imageUrl ?? undefined,
          },
          include: {
            role: { select: { id: true, name: true, displayName: true } },
            preferredJobRole: true
          }
        });
      } else {
        user = await prisma.user.create({
          data: {
            clerkId: userId,
            email,
            firstName: clerkUser?.firstName || "",
            lastName: clerkUser?.lastName || "",
            phone: "",
            department: "",
            bio: "",
            skills: [],
            roleId: "user_role_id",
            joinDate: new Date().toLocaleDateString('vi-VN'),
            lastLogin: new Date(),
            status: "Hoạt động"
          },
          include: {
            role: { select: { id: true, name: true, displayName: true } },
            preferredJobRole: true
          }
        });
      }
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
        include: {
          role: { select: { id: true, name: true, displayName: true } },
          preferredJobRole: true
        }
      });
    }

    // Include relations for response
    const finalUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
        preferredJobRole: true
      }
    });

    if (!finalUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Add computed fullName to response
    const responseUser = {
      ...finalUser,
      fullName: `${finalUser.firstName || ''} ${finalUser.lastName || ''}`.trim() || null,
      role: finalUser.role?.name || 'user' // Backward compatibility
    };

    return NextResponse.json(responseUser);

  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Try multiple approaches to get user ID
    let userId = null;
    
    try {
      const { userId: authUserId } = await auth();
      userId = authUserId;
    } catch {}
    
    if (!userId) {
      try {
        const clerkUser = await currentUser();
        if (clerkUser) {
          userId = clerkUser.id;
        }
      } catch {}
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const data = await request.json();

    // Upsert user with new data
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      create: {
        clerkId: userId,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        phone: data.phone || "",
        department: data.department || "",
        preferredJobRoleId: data.preferredJobRoleId || null,
        bio: data.bio || "",
        skills: data.skills || [],
        roleId: "user_role_id", // Default role
        joinDate: new Date().toLocaleDateString('vi-VN'),
        lastLogin: new Date(),
        status: "Hoạt động",
        experienceLevel: data.experienceLevel || 'mid'
      },
      update: {
        firstName: data.firstName !== undefined ? data.firstName : undefined,
        lastName: data.lastName !== undefined ? data.lastName : undefined,
        email: data.email !== undefined ? data.email : undefined,
        phone: data.phone !== undefined ? data.phone : undefined,
        department: data.department !== undefined ? data.department : undefined,
        preferredJobRoleId: data.preferredJobRoleId !== undefined ? data.preferredJobRoleId : undefined,
        bio: data.bio !== undefined ? data.bio : undefined,
        skills: data.skills !== undefined ? data.skills : undefined,
        lastLogin: new Date(),
        experienceLevel: data.experienceLevel !== undefined ? data.experienceLevel : undefined
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
        preferredJobRole: true
      }
    });

    // Add computed fullName to response
    const responseUser = {
      ...user,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
      role: user.role?.name || 'user' // Backward compatibility
    };

    return NextResponse.json(responseUser);

  } catch (error) {
    console.error('Profile PUT error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
