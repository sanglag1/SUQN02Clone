import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch user's interview preferences
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await getAuth(request);
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        preferredJobRole: {
          include: {
            category: true,
            specialization: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const preferences = {
      preferredJobRoleId: user.preferredJobRoleId,
      preferredLanguage: user.preferredLanguage || 'vi',
      autoStartWithPreferences: user.autoStartWithPreferences ?? true,
      interviewPreferences: user.interviewPreferences || {},
      preferredJobRole: user.preferredJobRole,
    };

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching interview preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interview preferences' },
      { status: 500 }
    );
  }
}

// PUT - Update user's interview preferences
export async function PUT(request: NextRequest) {
  try {
    const { userId: clerkId } = await getAuth(request);
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      preferredJobRoleId,
      preferredLanguage,
      autoStartWithPreferences,
      interviewPreferences,
    } = body;

    // Validate job role if provided
    if (preferredJobRoleId) {
      const jobRole = await prisma.jobRole.findUnique({
        where: { id: preferredJobRoleId },
      });
      if (!jobRole) {
        return NextResponse.json(
          { error: 'Invalid job role ID' },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { clerkId },
      data: {
        preferredJobRoleId: preferredJobRoleId || null,
        preferredLanguage: preferredLanguage || 'vi',
        autoStartWithPreferences: autoStartWithPreferences ?? true,
        interviewPreferences: interviewPreferences || {},
      },
      include: {
        preferredJobRole: {
          include: {
            category: true,
            specialization: true,
          },
        },
      },
    });

    const preferences = {
      preferredJobRoleId: updatedUser.preferredJobRoleId,
      preferredLanguage: updatedUser.preferredLanguage,
      autoStartWithPreferences: updatedUser.autoStartWithPreferences,
      interviewPreferences: updatedUser.interviewPreferences,
      preferredJobRole: updatedUser.preferredJobRole,
    };

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error updating interview preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update interview preferences' },
      { status: 500 }
    );
  }
}
