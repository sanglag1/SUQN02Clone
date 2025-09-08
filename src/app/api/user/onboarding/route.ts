import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "../../../../lib/prisma";

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      step,
      data
    } = body;

    if (!step || !data) {
      return NextResponse.json(
        { error: "Step and data are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    let updateData: any = {};

    // Xử lý từng step
    switch (step) {
      case 'job-role':
        updateData.preferredJobRoleId = data.jobRoleId;
        break;
      
      case 'experience':
        updateData.experienceLevel = data.experienceLevel;
        break;
      
      case 'skills':
        updateData.skills = data.skills || [];
        break;
      
      case 'profile':
        updateData = {
          ...updateData,
          firstName: data.firstName || user.firstName,
          lastName: data.lastName || user.lastName,
          phone: data.phone || user.phone,
          bio: data.bio || user.bio,
          department: data.department || user.department,
          joinDate: data.joinDate || user.joinDate
        };
        break;
      
      default:
        return NextResponse.json(
          { error: "Invalid step" },
          { status: 400 }
        );
    }

    const updatedUser = await prisma.user.update({
      where: { clerkId: userId },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      step,
      user: updatedUser
    });

  } catch (error) {
    console.error("Error saving onboarding data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      jobRoleId,
      experienceLevel,
      skills,
      firstName,
      lastName,
      phone,
      bio,
      department,
      joinDate
    } = body;

    const updateData: any = {};

    if (jobRoleId) updateData.preferredJobRoleId = jobRoleId;
    if (experienceLevel) updateData.experienceLevel = experienceLevel;
    if (skills) updateData.skills = skills;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (department !== undefined) updateData.department = department;
    if (joinDate !== undefined) updateData.joinDate = joinDate;

    const updatedUser = await prisma.user.update({
      where: { clerkId: userId },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      user: updatedUser,
      onboardingCompleted: true
    });

  } catch (error) {
    console.error("Error completing onboarding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
