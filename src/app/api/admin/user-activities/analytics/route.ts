import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type ProcessedUserActivity = {
  activities: Record<string, unknown>[];
  skills: Record<string, unknown>[];
  goals: Record<string, unknown>[];
  learningStats: Record<string, unknown>;
  userId?: string;
  user?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    role?: {
      name: string;
      displayName?: string;
    };
    createdAt?: Date;
  };
};

export async function GET(request: NextRequest) {
  try {
    // Verify admin permission
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
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
    
    if (!user || user.role?.name !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30'; // days
    const recentLimitParam = searchParams.get('recentLimit');
    const recentLimit = recentLimitParam ? parseInt(recentLimitParam) : 0; // 0 = no limit
    const topLimitParam = searchParams.get('topLimit');
    const topLimit = topLimitParam ? parseInt(topLimitParam) : 0; // 0 = no limit
    const days = parseInt(timeframe);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get all user activities with user info - include role relation properly
    const userActivities = await prisma.userActivity.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
            role: {
              select: {
                name: true,
                displayName: true
              }
            }
          }
        }
      }
    });

    // Get total users count
    const totalUsers = await prisma.user.count();

    // Process activities data
    const allActivities: Record<string, unknown>[] = [];
    const processedUserActivities = userActivities.map((ua) => {
      const activities = Array.isArray(ua.activities) ? ua.activities as Record<string, unknown>[] : [];
      const skills = Array.isArray(ua.skills) ? ua.skills as Record<string, unknown>[] : [];
      const goals = Array.isArray(ua.goals) ? ua.goals as Record<string, unknown>[] : [];
      const learningStats = (ua.learningStats ?? {}) as Record<string, unknown>;
      
      // Add user info to activities for global stats
      const activitiesWithUser = activities.map(activity => ({
        ...activity,
        userId: ua.userId,
        userName: ua.user ? `${ua.user.firstName || ''} ${ua.user.lastName || ''}`.trim() || ua.user.email : 'Unknown',
        userEmail: ua.user?.email || 'N/A'
      }));
      
      allActivities.push(...activitiesWithUser);
      
      return {
        ...ua,
        activities,
        skills,
        goals,
        learningStats
      };
    }) as ProcessedUserActivity[];

    // Calculate active users (users with activities in timeframe)
    const activeUsers = processedUserActivities.filter((ua) => 
      ua.activities.some((a: Record<string, unknown>) => {
        const timestamp = a.timestamp as string;
        return timestamp && new Date(timestamp) >= startDate;
      })
    ).length;

    // Activity statistics
    const recentActivities = allActivities.filter((a: Record<string, unknown>) => {
      const timestamp = a.timestamp as string;
      return timestamp && new Date(timestamp) >= startDate;
    });

    // Helper function to check if an activity is a JD activity
    const isJDActivity = (activity: Record<string, unknown>) => {
      return activity.type === 'jd';
    };

    const activityStats = {
      totalInterviews: allActivities.filter((a: Record<string, unknown>) => a.type === 'interview' && !isJDActivity(a)).length,
      totalQuizzes: allActivities.filter((a: Record<string, unknown>) => a.type === 'quiz').length,
      totalTests: allActivities.filter((a: Record<string, unknown>) => a.type === 'test').length,
      totalEQs: allActivities.filter((a: Record<string, unknown>) => a.type === 'eq').length,
      totalJDs: allActivities.filter(isJDActivity).length,
      totalPractice: allActivities.filter((a: Record<string, unknown>) => a.type === 'practice').length,
      recentInterviews: recentActivities.filter((a: Record<string, unknown>) => a.type === 'interview' && !isJDActivity(a)).length,
      recentQuizzes: recentActivities.filter((a: Record<string, unknown>) => a.type === 'quiz').length,
      recentTests: recentActivities.filter((a: Record<string, unknown>) => a.type === 'test').length,
      recentEQs: recentActivities.filter((a: Record<string, unknown>) => a.type === 'eq').length,
      recentJDs: recentActivities.filter(isJDActivity).length,
      recentPractice: recentActivities.filter((a: Record<string, unknown>) => a.type === 'practice').length,
      averageScore: allActivities.length > 0
        ? allActivities.reduce((sum: number, a: Record<string, unknown>) => sum + (Number(a.score) || 0), 0) / allActivities.length
        : 0
    };

    // User engagement metrics
    const engagementMetrics = {
      dailyActiveUsers: processedUserActivities.filter((ua) => 
        ua.activities.some((a: Record<string, unknown>) => {
          const timestamp = a.timestamp as string;
          return timestamp && new Date(timestamp) >= new Date(Date.now() - 24 * 60 * 60 * 1000);
        })
      ).length,
      weeklyActiveUsers: processedUserActivities.filter((ua) => 
        ua.activities.some((a: Record<string, unknown>) => {
          const timestamp = a.timestamp as string;
          return timestamp && new Date(timestamp) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        })
      ).length,
      monthlyActiveUsers: processedUserActivities.filter((ua) =>
        ua.activities.some((a: Record<string, unknown>) => {
          const timestamp = a.timestamp as string;
          return timestamp && new Date(timestamp) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        })
      ).length
    };

    // Learning statistics
    const learningStats = {
      totalStudyTime: processedUserActivities.reduce((sum: number, ua) => 
        sum + (Number(ua.learningStats.totalStudyTime) || 0), 0
      ),
      averageStreak: processedUserActivities.length > 0
        ? processedUserActivities.reduce((sum: number, ua) => 
            sum + (Number(ua.learningStats.streak) || 0), 0
          ) / processedUserActivities.length
        : 0,
      totalGoals: processedUserActivities.reduce((sum: number, ua) => 
        sum + ua.goals.length, 0
      ),
      completedGoals: processedUserActivities.reduce((sum: number, ua) => 
        sum + ua.goals.filter((g: Record<string, unknown>) => g.status === 'completed').length, 0
      )
    };

    // Skill distribution
    const allSkills = processedUserActivities.flatMap((ua) => ua.skills);
    const skillDistribution = allSkills.reduce((acc: Record<string, Record<string, unknown>>, skill: Record<string, unknown>) => {
      const skillName = skill?.name as string;
      if (!skillName) return acc;
      
      if (!acc[skillName]) {
        acc[skillName] = {
          count: 0,
          averageScore: 0,
          levels: { beginner: 0, intermediate: 0, advanced: 0, expert: 0 }
        };
      }
      const skillData = acc[skillName];
      skillData.count = (skillData.count as number) + 1;
      skillData.averageScore = (skillData.averageScore as number) + (Number(skill.score) || 0);
      const levels = skillData.levels as Record<string, number>;
      const skillLevel = skill.level as string;
      if (skillLevel && levels[skillLevel] !== undefined) {
        levels[skillLevel]++;
      }
      return acc;
    }, {});

    // Calculate averages and convert to array
    const skillDistributionArray = Object.entries(skillDistribution).map(([name, data]) => {
      const skillData = data as Record<string, unknown>;
      return {
        name,
        userCount: skillData.count as number,
        averageScore: (skillData.count as number) > 0 ? Math.round((skillData.averageScore as number) / (skillData.count as number)) : 0,
        levelDistribution: skillData.levels
      };
    }).sort((a: { userCount: number }, b: { userCount: number }) => b.userCount - a.userCount);

    // Activity trends (daily for the past timeframe)
    const activityTrends = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayActivities = allActivities.filter((a: Record<string, unknown>) => {
        const timestamp = a.timestamp as string;
        if (!timestamp) return false;
        const activityDate = new Date(timestamp);
        return activityDate >= dayStart && activityDate < dayEnd;
      });

      activityTrends.push({
        date: dayStart.toISOString().split('T')[0],
        interviews: dayActivities.filter((a: Record<string, unknown>) => a.type === 'interview' && !isJDActivity(a)).length,
        quizzes: dayActivities.filter((a: Record<string, unknown>) => a.type === 'quiz').length,
        tests: dayActivities.filter((a: Record<string, unknown>) => a.type === 'test').length,
        eqs: dayActivities.filter((a: Record<string, unknown>) => a.type === 'eq').length,
        jds: dayActivities.filter(isJDActivity).length,
        practice: dayActivities.filter((a: Record<string, unknown>) => a.type === 'practice').length,
        total: dayActivities.length,
        averageScore: dayActivities.length > 0
          ? dayActivities.reduce((sum: number, a: Record<string, unknown>) => sum + (Number(a.score) || 0), 0) / dayActivities.length
          : 0
      });
    }

    // Top performers
    let topPerformers = processedUserActivities
      .map((ua) => {
        const avgScore = ua.activities.length > 0
          ? ua.activities.reduce((sum: number, a: Record<string, unknown>) => sum + (Number(a.score) || 0), 0) / ua.activities.length
          : 0;
        
        return {
          userId: ua.userId,
          userName: ua.user ? `${ua.user.firstName || ''} ${ua.user.lastName || ''}`.trim() || ua.user.email : 'Unknown',
          email: ua.user?.email || 'N/A',
          averageScore: Math.round(avgScore),
          totalActivities: ua.activities.length,
          studyStreak: Number(ua.learningStats.streak) || 0,
          totalStudyTime: Number(ua.learningStats.totalStudyTime) || 0
        };
      })
      .filter((user: { totalActivities: number }) => user.totalActivities > 0)
      .sort((a: { averageScore: number }, b: { averageScore: number }) => b.averageScore - a.averageScore);

    if (topLimit > 0) {
      topPerformers = topPerformers.slice(0, topLimit);
    }

    // Most active users
    const mostActiveUsers = processedUserActivities
      .map((ua) => ({
        userId: ua.userId,
        userName: ua.user ? `${ua.user.firstName || ''} ${ua.user.lastName || ''}`.trim() || ua.user.email : 'Unknown',
        email: ua.user?.email || 'N/A',
        totalActivities: ua.activities.length,
        recentActivities: ua.activities.filter((a: Record<string, unknown>) => {
          const timestamp = a.timestamp as string;
          return timestamp && new Date(timestamp) >= startDate;
        }).length,
        studyStreak: Number(ua.learningStats.streak) || 0
      }))
      .filter((user: { totalActivities: number }) => user.totalActivities > 0)
      .sort((a: { totalActivities: number }, b: { totalActivities: number }) => b.totalActivities - a.totalActivities)
      .slice(0, 10);

    // Goal completion insights
    const goalInsights = {
      totalGoalsSet: learningStats.totalGoals,
      goalsCompleted: learningStats.completedGoals,
      completionRate: learningStats.totalGoals > 0 
        ? Math.round((learningStats.completedGoals / learningStats.totalGoals) * 100)
        : 0,
      averageGoalsPerUser: processedUserActivities.length > 0 
        ? Math.round(learningStats.totalGoals / processedUserActivities.length * 100) / 100
        : 0
    };

    // Recent activities with user info (configurable limit; default = all)
    let recentActivitiesWithUsers = allActivities
      .filter((a: Record<string, unknown>) => {
        const timestamp = a.timestamp as string;
        return timestamp && new Date(timestamp) >= startDate;
      })
      .sort((a, b) => {
        const timestampA = new Date(a.timestamp as string).getTime();
        const timestampB = new Date(b.timestamp as string).getTime();
        return timestampB - timestampA;
      });

    if (recentLimit > 0) {
      recentActivitiesWithUsers = recentActivitiesWithUsers.slice(0, recentLimit);
    }

    recentActivitiesWithUsers = recentActivitiesWithUsers
      .map((activity) => ({
        type: activity.type,
        score: activity.score,
        timestamp: activity.timestamp,
        duration: activity.duration,
        userId: activity.userId,
        userName: activity.userName,
        userEmail: activity.userEmail,
        referenceId: activity.referenceId, // Add referenceId for JD activity detection
        details: activity.details || {}
      }));

    return NextResponse.json({
      overview: {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        userGrowthRate: 0, // Could be calculated with historical data
        platformEngagement: totalUsers > 0 ? Math.round(((activeUsers || 0) / totalUsers) * 100) : 0
      },
      activityStats,
      engagementMetrics,
      learningStats,
      skillDistribution: skillDistributionArray,
      activityTrends,
      topPerformers,
      mostActiveUsers,
      goalInsights,
      recentActivities: recentActivitiesWithUsers,
      timeframe: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Error fetching user activity analytics:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
