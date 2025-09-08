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

    // Kiểm tra xem user có cần onboarding không
    // User cần onboarding nếu chưa có preferredJobRoleId hoặc experienceLevel
    const needsOnboarding = !user.preferredJobRoleId || !user.experienceLevel;
    
    // Kiểm tra xem user có phải là user mới không (tạo trong vòng 24h)
    const isNewUser = new Date().getTime() - user.createdAt.getTime() < 24 * 60 * 60 * 1000;

    // Chỉ yêu cầu onboarding khi thiếu dữ liệu cần thiết,
    // KHÔNG ép buộc user mới đã hoàn tất quay lại onboarding.
    return NextResponse.json({
      needsOnboarding,
      isNewUser,
      user,
      onboardingCompleted: !needsOnboarding
    });

  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
