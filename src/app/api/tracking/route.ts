import { NextResponse } from 'next/server';
import { TrackingIntegrationService } from '@/services/trackingIntegrationService';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

interface ProgressData {
  activities?: Array<{ timestamp: string }>;
  recentActivities?: Array<{ timestamp: string }>;
  [key: string]: unknown;
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Tìm user trong Prisma database bằng clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      // Initialize a new user if needed
      return NextResponse.json({
        stats: {
          totalInterviews: 0,
          averageScore: 0,
          studyStreak: 0,
          totalStudyTime: 0
        },
        skillProgress: [],
        currentFocus: ['Complete your profile', 'Start your first interview practice'],
        nextMilestones: [
          {
            goal: 'Complete first interview practice',
            targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        ],
        recommendations: [
          'Complete your profile to get personalized recommendations',
          'Try a practice interview to assess your current level',
          'Set your learning goals in the dashboard'
        ]
      });
    }

    try {
      const progress = await TrackingIntegrationService.getProgressOverview(user.id) as ProgressData;
      
      // Đảm bảo recentActivities có sẵn từ activities nếu chưa có
      if (
        progress &&
        typeof progress === 'object' &&
        'activities' in progress &&
        Array.isArray(progress.activities) &&
        !('recentActivities' in progress)
      ) {
        const activities = progress.activities;
        progress.recentActivities = activities
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 20);
      }
      return NextResponse.json(progress);
    } catch (fetchError) {
      console.error('Error in TrackingIntegrationService.getProgressOverview:', fetchError);
      return NextResponse.json({
        stats: {
          totalInterviews: 0,
          averageScore: 0.0,
          studyStreak: 0,
          totalStudyTime: 0
        },
        skillProgress: [],
        currentFocus: ['Complete your first interview practice'],
        nextMilestones: [
          {
            goal: 'Complete first interview practice',
            targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        ],
        recommendations: [
          'Start with a practice interview to assess your current level',
          'Set up your learning goals in the dashboard',
          'Review available learning resources'
        ]
      });
    }
  } catch (error) {
    console.error('Error fetching progress:', error);
    // Return a more detailed error message in development
    const message = process.env.NODE_ENV === 'development' 
      ? `Failed to fetch progress: ${error instanceof Error ? error.message : 'Unknown error'}`
      : 'Failed to fetch progress';
      
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
