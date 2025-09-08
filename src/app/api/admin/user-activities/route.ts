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

    // Get all users first, then include their activities (if any)
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: userWhere,
        include: {
          userActivity: true // Include user activity data (may be null)
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

    // Define types for activities, skills, and goals
    type Activity = {
      type: string;
      score?: number;
      timestamp: string;
    };

    type Skill = {
      score: number;
      [key: string]: unknown;
    };

    type Goal = {
      status: string;
      [key: string]: unknown;
    };

    // Calculate summary statistics for each user including real-time activity
    const enrichedActivities = users.map(user => {
      const userActivity = user.userActivity; // May be null for users with no activity
      const activities: Activity[] = userActivity && Array.isArray(userActivity.activities) ? userActivity.activities as Activity[] : [];
      const skills: Skill[] = userActivity && Array.isArray(userActivity.skills) ? userActivity.skills as Skill[] : [];
      const goals: Goal[] = userActivity && Array.isArray(userActivity.goals) ? userActivity.goals as Goal[] : [];
      const learningStats = (userActivity?.learningStats as { streak?: number; totalStudyTime?: number }) || {};
      
      // Calculate real-time activity status using multiple indicators
      const now = new Date();
      
      // Use the most recent timestamp from available fields
      const lastActivity = user.lastActivity || user.lastLogin || user.lastSignInAt || user.updatedAt || user.createdAt;
      const timeSinceLastActivity = now.getTime() - lastActivity.getTime();
      
      // For currently active: check if user has active Clerk session AND recent activity (5 minutes)
      const isCurrentlyActive = user.clerkSessionActive && timeSinceLastActivity < 5 * 60 * 1000;
      
      // For currently online: check if user has active Clerk session AND recent activity (20 minutes)
      // OR if they have very recent lastLogin/lastSignInAt (within 20 minutes)
      const hasRecentClerkActivity = user.clerkSessionActive && timeSinceLastActivity < 20 * 60 * 1000;
      const hasRecentLogin = user.lastLogin && (now.getTime() - user.lastLogin.getTime()) < 20 * 60 * 1000;
      const hasRecentSignIn = user.lastSignInAt && (now.getTime() - user.lastSignInAt.getTime()) < 20 * 60 * 1000;
      
      const isCurrentlyOnline = hasRecentClerkActivity || hasRecentLogin || hasRecentSignIn;

      const totalInterviews = activities.filter((a) => a.type === 'interview').length;
      const totalQuizzes = activities.filter((a) => a.type === 'quiz').length;
      const totalTests = activities.filter((a) => a.type === 'test').length;
      const totalEQs = activities.filter((a) => a.type === 'eq').length;
      const totalPractice = activities.filter((a) => a.type === 'practice').length;
      
      const averageScore = activities.length > 0 
        ? activities.reduce((sum, act) => sum + (act.score || 0), 0) / activities.length
        : 0;

      const recentActivity = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

      const topSkills = skills
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      const completedGoals = goals.filter((g) => g.status === 'completed').length;
      const activeGoals = goals.filter((g) => g.status === 'in_progress').length;

      return {
        id: userActivity?.id || `user-${user.id}`, // Use userActivity ID if exists, otherwise create unique ID
        user: {
          ...user,
          // Add real-time activity status
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
          totalActivities: activities.length,
          averageScore: Math.round(averageScore * 100) / 100,
          studyStreak: learningStats.streak || 0,
          totalStudyTime: learningStats.totalStudyTime || 0,
          completedGoals,
          activeGoals
        },
        topSkills,
        recentActivity: recentActivity ? {
          type: recentActivity.type,
          score: recentActivity.score,
          timestamp: recentActivity.timestamp
        } : null,
        lastUpdated: userActivity?.lastActive || user.updatedAt,
        strengths: userActivity && Array.isArray(userActivity.strengths) ? userActivity.strengths : [],
        weaknesses: userActivity && Array.isArray(userActivity.weaknesses) ? userActivity.weaknesses : []
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
        const userActivity = user.userActivity;
        if (!userActivity) return false;
        const activities = Array.isArray(userActivity.activities) ? userActivity.activities as Activity[] : [];
        return activities.some((a: Activity) => 
          new Date(a.timestamp).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
        );
      }).length,
      totalInterviews: users.reduce((sum, user) => {
        const userActivity = user.userActivity;
        if (!userActivity) return sum;
        const activities = Array.isArray(userActivity.activities) ? userActivity.activities as Activity[] : [];
        return sum + activities.filter((a: Activity) => a.type === 'interview').length;
      }, 0),
      averageScore: users.filter(user => user.userActivity).length > 0
        ? users.reduce((sum, user) => {
            const userActivity = user.userActivity;
            if (!userActivity) return sum;
            const activities = Array.isArray(userActivity.activities) ? userActivity.activities as Activity[] : [];
            const userAvg = activities.length > 0 
              ? activities.reduce((s: number, a: Activity) => s + (a.score || 0), 0) / activities.length
              : 0;
            return sum + userAvg;
          }, 0) / users.filter(user => user.userActivity).length
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
