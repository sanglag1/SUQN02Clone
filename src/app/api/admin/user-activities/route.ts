import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'lastActive';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build search query for users
    let userWhere = {};
    if (search) {
      userWhere = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    // Get all users first, then include their tracking data
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: userWhere,
        include: {
          dailyStats: {
            orderBy: { date: 'desc' },
            take: 1
          },
          activityEvents: {
            orderBy: { timestamp: 'desc' },
            take: 10
          },
          skillSnapshots: {
            orderBy: { createdAt: 'desc' },
            take: 20
          }
        },
        orderBy: sortBy === 'lastActive' ? { lastActivity: sortOrder } : 
                 sortBy === 'createdAt' ? { createdAt: sortOrder } :
                 { updatedAt: sortOrder },
        skip: skip,
        take: limit
      }),
      prisma.user.count({
        where: userWhere
      })
    ]);

    // Calculate summary statistics for each user including real-time activity
    const enrichedActivities = users.map(user => {
      // Get data from new tracking system
      const latestDailyStats = user.dailyStats[0];
      const recentEvents = user.activityEvents;
      const recentSnapshots = user.skillSnapshots;
      
      // Calculate activity counts from events
      const totalInterviews = recentEvents.filter(e => e.activityType === 'interview').length;
      const totalQuizzes = recentEvents.filter(e => e.activityType === 'quiz').length;
      const totalTests = 0; // test not in ActivityType enum
      const totalEQs = 0; // eq not in ActivityType enum  
      const totalPractice = recentEvents.filter(e => e.activityType === 'practice').length;
      
      // Calculate average score from events
      const scores = recentEvents.filter(e => e.score !== null).map(e => e.score!);
      const averageScore = scores.length > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0;

      // Get recent activity
      const recentActivity = recentEvents[0] ? {
        type: recentEvents[0].activityType,
        score: recentEvents[0].score,
        timestamp: recentEvents[0].timestamp.toISOString()
      } : null;

      // Get top skills from snapshots
      const skillMap = new Map<string, number>();
      recentSnapshots.forEach(snapshot => {
        const currentScore = skillMap.get(snapshot.skillName) || 0;
        skillMap.set(snapshot.skillName, Math.max(currentScore, snapshot.score));
      });
      
      const topSkills = Array.from(skillMap.entries())
        .map(([name, score]) => ({ name, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      // Calculate real-time activity status
      const now = new Date();
      const lastActivity = user.lastActivity || user.lastLogin || user.lastSignInAt || user.updatedAt || user.createdAt;
      const timeSinceLastActivity = now.getTime() - lastActivity.getTime();
      
      const isCurrentlyActive = user.clerkSessionActive && timeSinceLastActivity < 5 * 60 * 1000;
      const hasRecentClerkActivity = user.clerkSessionActive && timeSinceLastActivity < 20 * 60 * 1000;
      const hasRecentLogin = user.lastLogin && (now.getTime() - user.lastLogin.getTime()) < 20 * 60 * 1000;
      const hasRecentSignIn = user.lastSignInAt && (now.getTime() - user.lastSignInAt.getTime()) < 20 * 60 * 1000;
      
      const isCurrentlyOnline = hasRecentClerkActivity || hasRecentLogin || hasRecentSignIn;

      return {
        id: `user-${user.id}`,
        user: {
          ...user,
          realTimeActivity: {
            isCurrentlyActive,
            isCurrentlyOnline,
            lastActivityText: timeSinceLastActivity < 60000 ? 'Just now' :
                             timeSinceLastActivity < 3600000 ? `${Math.floor(timeSinceLastActivity / 60000)}m ago` :
                             timeSinceLastActivity < 86400000 ? `${Math.floor(timeSinceLastActivity / 3600000)}h ago` :
                             `${Math.floor(timeSinceLastActivity / 86400000)}d ago`,
            lastActivityTimestamp: lastActivity
          }
        },
        stats: {
          totalInterviews,
          totalQuizzes,
          totalTests,
          totalEQs,
          totalPractice,
          totalActivities: recentEvents.length,
          averageScore: Math.round(averageScore * 100) / 100,
          studyStreak: latestDailyStats?.totalActivities || 0,
          totalStudyTime: latestDailyStats?.totalDuration || 0,
          completedGoals: 0, // Goals not tracked in new system yet
          activeGoals: 0
        },
        topSkills,
        recentActivity,
        lastUpdated: recentEvents[0]?.timestamp || user.updatedAt,
        strengths: [], // Not tracked in new system yet
        weaknesses: [] // Not tracked in new system yet
      };
    });

    // Calculate overall statistics including real-time data
    const currentlyActiveUsers = enrichedActivities.filter(ea => 
      ea.user.realTimeActivity.isCurrentlyActive
    ).length;
    
    const currentlyOnlineUsers = enrichedActivities.filter(ea => 
      ea.user.realTimeActivity.isCurrentlyOnline  
    ).length;

    const overallStats = {
      totalUsers: totalCount,
      currentlyActiveUsers, // Users active in last 5 minutes
      currentlyOnlineUsers, // Users active in last 15 minutes
      activeUsers: users.filter(user => {
        const recentEvents = user.activityEvents;
        return recentEvents.some(event => 
          event.timestamp.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
        );
      }).length,
      totalInterviews: users.reduce((sum, user) => {
        const recentEvents = user.activityEvents;
        return sum + recentEvents.filter(e => e.activityType === 'interview').length;
      }, 0),
      averageScore: users.filter(user => user.activityEvents.length > 0).length > 0
        ? users.reduce((sum, user) => {
            const recentEvents = user.activityEvents;
            const scores = recentEvents.filter(e => e.score !== null).map(e => e.score!);
            const userAvg = scores.length > 0 
              ? scores.reduce((s, score) => s + score, 0) / scores.length
              : 0;
            return sum + userAvg;
          }, 0) / users.filter(user => user.activityEvents.length > 0).length
        : 0
    };

    return NextResponse.json({
      activities: enrichedActivities,
      summary: {
        totalUsers: totalCount,
        currentlyActiveUsers, // Real-time active users (last 5 min)
        currentlyOnlineUsers, // Real-time online users (last 20 min)
        activeUsers: overallStats.activeUsers, // Historical active users (last 7 days)
        totalActivities: overallStats.totalInterviews,
        averageScore: Math.round(overallStats.averageScore * 100) / 100
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error("Error fetching user activities:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
