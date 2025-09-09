import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    // Verify admin permission
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: {
        role: {
          select: {
            name: true,
            displayName: true
          }
        }
      }
    });
    
    if (!adminUser || adminUser.role?.name !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = parseInt(searchParams.get('timeRange') || '30');
    const activityType = searchParams.get('activityType') || 'all';
    
    const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000);

    // Get user with tracking data
    const userActivity = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        dailyStats: {
          orderBy: { date: 'desc' }
        },
        activityEvents: {
          orderBy: { timestamp: 'desc' }
        },
        skillSnapshots: {
          orderBy: { createdAt: 'desc' }
        },
        role: {
          select: {
            name: true,
            displayName: true
          }
        }
      }
    });

    if (!userActivity) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Process activities from new tracking system
    const events = userActivity.activityEvents;
    const snapshots = userActivity.skillSnapshots;
    const dailyStats = userActivity.dailyStats;
    
    // Convert events to activities format
    const activities = events.map((event) => ({
      id: event.id,
      type: event.activityType,
      score: event.score,
      duration: event.duration,
      timestamp: event.timestamp.toISOString(),
      referenceId: event.referenceId,
      details: event.metadata || {}
    }));

    // Filter activities by time range and type
    const filteredActivities = activities.filter((activity: Record<string, unknown>) => {
      const timestamp = activity.timestamp as string;
      const activityTimestamp = timestamp ? new Date(timestamp) : null;
      const typeMatch = activityType === 'all' || activity.type === activityType;
      const timeMatch = !activityTimestamp || activityTimestamp >= startDate;
      
      return typeMatch && timeMatch;
    });

    // Calculate stats
    const stats = {
      totalActivities: filteredActivities.length,
      byType: {
        interview: filteredActivities.filter((a: Record<string, unknown>) => a.type === 'interview').length,
        quiz: filteredActivities.filter((a: Record<string, unknown>) => a.type === 'quiz').length,
        test: filteredActivities.filter((a: Record<string, unknown>) => a.type === 'test').length,
        eq: filteredActivities.filter((a: Record<string, unknown>) => a.type === 'eq').length,
        practice: filteredActivities.filter((a: Record<string, unknown>) => a.type === 'practice').length,
        learning: filteredActivities.filter((a: Record<string, unknown>) => a.type === 'learning').length,
        goalCompleted: 0, // Goals not tracked in new system yet
        goalStarted: 0
      },
      averageScore: filteredActivities.length > 0
        ? filteredActivities.reduce((sum: number, a: Record<string, unknown>) => sum + (Number(a.score) || 0), 0) / filteredActivities.length
        : 0,
      totalDuration: filteredActivities.reduce((sum: number, a: Record<string, unknown>) => sum + (Number(a.duration) || 0), 0),
      bestScore: filteredActivities.length > 0
        ? Math.max(...filteredActivities.map((a: Record<string, unknown>) => Number(a.score) || 0))
        : 0,
      worstScore: filteredActivities.length > 0
        ? Math.min(...filteredActivities.map((a: Record<string, unknown>) => Number(a.score) || 0))
        : 0,
      currentStreak: dailyStats.length > 0 ? dailyStats[0].totalActivities : 0,
      longestStreak: dailyStats.length > 0 ? dailyStats[0].totalActivities : 0,
      totalStudyTime: dailyStats.reduce((sum: number, stat: { totalDuration: number }) => sum + stat.totalDuration, 0)
    };

    // Recent activities (last 10)
    const recentActivities = [...filteredActivities]
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const timestampA = new Date(a.timestamp as string).getTime();
        const timestampB = new Date(b.timestamp as string).getTime();
        return timestampB - timestampA;
      })
      .slice(0, 10);

    // Skills data from snapshots
    const skillsData = snapshots.map((snapshot: { skillName: string; score: number; createdAt: Date }) => ({
      name: snapshot.skillName,
      currentScore: snapshot.score,
      level: 'intermediate', // Default level
      category: 'general',
      lastAssessed: snapshot.createdAt.toISOString()
    }));

    return NextResponse.json({
      user: {
        id: userActivity.id,
        firstName: userActivity.firstName || '',
        lastName: userActivity.lastName || '',
        email: userActivity.email,
        role: userActivity.role,
        isOnline: false,
        lastActivity: userActivity.createdAt.toISOString(),
        clerkId: userActivity.clerkId
      },
      stats,
      activities: recentActivities,
      skills: skillsData,
      goals: {
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        completionRate: 0
      },
      learningStats: {
        totalStudyTime: stats.totalStudyTime,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        averageSessionDuration: stats.totalActivities > 0 
          ? Math.round(stats.totalDuration / stats.totalActivities)
          : 0,
        totalSessions: stats.totalActivities,
        completionRate: 0
      },
      timeframe: {
        days: timeRange,
        activityType,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Error fetching user activity details:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
