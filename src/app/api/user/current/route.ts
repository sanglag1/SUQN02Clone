import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "../../../../lib/prisma";

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        preferredJobRoleId: true,
        experienceLevel: true,
        skills: true,
        bio: true,
        department: true,
        joinDate: true,
        createdAt: true,
        updatedAt: true,
        preferredJobRole: {
          select: {
            id: true,
            title: true,
            level: true,
            category: {
              select: {
                id: true,
                name: true
              }
            },
            specialization: {
              select: {
                id: true,
                name: true
              }
            }
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

    return NextResponse.json(user);

  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
