import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, clerkId } = body;
    
    if (!email && !clerkId) {
      return NextResponse.json(
        { error: "Email or clerkId is required" },
        { status: 400 }
      );
    }
    
    // Tìm user theo email hoặc clerkId
    const where = email ? { email } : { clerkId };
    const user = await prisma.user.findUnique({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Tìm role admin theo name để tránh hardcode roleId
    const adminRole = await prisma.role.findFirst({ where: { name: "admin" } });
    if (!adminRole) {
      return NextResponse.json(
        { error: "Admin role not found" },
        { status: 400 }
      );
    }

    // Update role thành admin
    const updatedUser = await prisma.user.update({
      where,
      data: {
        roleId: adminRole.id
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        }
      }
    });

    return NextResponse.json({
      message: "User has been granted admin privileges",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim(),
        roleId: updatedUser.roleId,
        role: updatedUser.role?.name || 'admin'
      }
    });
    
  } catch (error) {
    console.error("Error updating user to admin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Lấy danh sách tất cả admin
    const adminRole = await prisma.role.findUnique({
      where: { name: 'admin' }
    });

    if (!adminRole) {
      return NextResponse.json({ message: "Admin role not found" }, { status: 500 });
    }

    const admins = await prisma.user.findMany({
      where: { roleId: adminRole.id },
      include: {
        role: true
      }
    });
    
    const adminsWithFullName = admins.map((admin) => ({
      id: admin.id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      fullName: `${admin.firstName || ''} ${admin.lastName || ''}`.trim(),
      roleName: admin.role?.name || 'admin',
      createdAt: admin.createdAt
    }));
    
    return NextResponse.json({
      message: "List of all admins",
      admins: adminsWithFullName,
      count: admins.length
    });
    
  } catch (error) {
    console.error("Error fetching admins:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
