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

    // Get user with activity data
    const userActivity = await prisma.userActivity.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            createdAt: true,
            clerkId: true
          }
        }
      }
    });

    if (!userActivity || !userActivity.user) {
      return NextResponse.json({ error: "User activity not found" }, { status: 404 });
    }

    // Process activities
    const activities = Array.isArray(userActivity.activities) ? userActivity.activities as Record<string, unknown>[] : [];
    const skills = Array.isArray(userActivity.skills) ? userActivity.skills as Record<string, unknown>[] : [];
    const goals = Array.isArray(userActivity.goals) ? userActivity.goals as Record<string, unknown>[] : [];
    const learningStats = userActivity.learningStats as Record<string, unknown> || {};

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
        goalCompleted: goals.filter((g: Record<string, unknown>) => g.status === 'completed').length,
        goalStarted: goals.filter((g: Record<string, unknown>) => g.status === 'in_progress').length,
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
      currentStreak: Number(learningStats.streak) || 0,
      longestStreak: Number(learningStats.longestStreak) || 0,
      totalStudyTime: Number(learningStats.totalStudyTime) || 0
    };

    // Recent activities (last 10)
    const recentActivities = [...filteredActivities]
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const timestampA = new Date(a.timestamp as string).getTime();
        const timestampB = new Date(b.timestamp as string).getTime();
        return timestampB - timestampA;
      })
      .slice(0, 10)
      .map((activity: Record<string, unknown>) => ({
        id: activity.id,
        type: activity.type,
        score: activity.score,
        duration: activity.duration,
        timestamp: activity.timestamp,
        referenceId: activity.referenceId, // Add referenceId for JD activity identification
        details: activity.details || {}
      }));

    // Goal insights
    const goalInsights = {
      total: goals.length,
      completed: goals.filter((g: Record<string, unknown>) => g.status === 'completed').length,
      inProgress: goals.filter((g: Record<string, unknown>) => g.status === 'in_progress').length,
      notStarted: goals.filter((g: Record<string, unknown>) => g.status === 'not_started').length,
      completionRate: goals.length > 0 
        ? Math.round((goals.filter((g: Record<string, unknown>) => g.status === 'completed').length / goals.length) * 100)
        : 0
    };

    // Skills data
    const skillsData = skills.map((skill: Record<string, unknown>) => ({
      name: skill.name,
      currentScore: Number(skill.score) || 0,
      level: skill.level as string || 'beginner',
      category: skill.category as string || 'general',
      lastAssessed: skill.lastAssessed || null
    }));

    return NextResponse.json({
      user: {
        id: userActivity.user.id,
        firstName: userActivity.user.firstName || '',
        lastName: userActivity.user.lastName || '',
        email: userActivity.user.email,
        role: userActivity.user.role,
        isOnline: false,
        lastActivity: userActivity.user.createdAt.toISOString(),
        clerkId: userActivity.user.clerkId
      },
      stats,
      activities: recentActivities,
      skills: skillsData,
      goals: goalInsights,
      learningStats: {
        totalStudyTime: stats.totalStudyTime,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        averageSessionDuration: stats.totalActivities > 0 
          ? Math.round(stats.totalDuration / stats.totalActivities)
          : 0,
        totalSessions: stats.totalActivities,
        completionRate: goalInsights.completionRate
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
