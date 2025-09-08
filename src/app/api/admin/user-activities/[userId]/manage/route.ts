import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
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

    const body = await request.json();
    const { action, data } = body;

    let result;

    switch (action) {
      case 'updateGoal':
        // Find the user activity and update the specific goal
        const userActivity = await prisma.userActivity.findUnique({
          where: { userId }
        });
        
        if (userActivity && userActivity.goals) {
          const goals = Array.isArray(userActivity.goals) ? userActivity.goals as Record<string, unknown>[] : [];
          const goalIndex = goals.findIndex((g: Record<string, unknown>) => g._id === data.goalId);
          
          if (goalIndex !== -1) {
            goals[goalIndex] = {
              ...goals[goalIndex],
              status: data.status,
              targetDate: data.targetDate,
              description: data.description,
              ...(data.status === 'completed' && { completedDate: new Date().toISOString() })
            };
            
            result = await prisma.userActivity.update({
              where: { userId },
              data: { goals: JSON.parse(JSON.stringify(goals)) }
            });
          }
        }
        break;

      case 'addGoal':
        const existingActivity = await prisma.userActivity.findUnique({
          where: { userId }
        });
        
        const currentGoals = Array.isArray(existingActivity?.goals) ? existingActivity.goals as Record<string, unknown>[] : [];
        const newGoal = {
          _id: Date.now().toString(), // Simple ID generation
          ...data,
          createdDate: new Date().toISOString(),
          status: 'pending'
        };
        
        result = await prisma.userActivity.update({
          where: { userId },
          data: { 
            goals: [...currentGoals, newGoal]
          }
        });
        break;

      case 'removeGoal':
        const activityForRemove = await prisma.userActivity.findUnique({
          where: { userId }
        });
        
        if (activityForRemove && activityForRemove.goals) {
          const goals = Array.isArray(activityForRemove.goals) ? activityForRemove.goals as Record<string, unknown>[] : [];
          const updatedGoals = goals.filter((g: Record<string, unknown>) => g._id !== data.goalId);
          
          result = await prisma.userActivity.update({
            where: { userId },
            data: { goals: JSON.parse(JSON.stringify(updatedGoals)) }
          });
        }
        break;

      case 'updateSkill':
        const activityForSkill = await prisma.userActivity.findUnique({
          where: { userId }
        });
        
        if (activityForSkill && activityForSkill.skills) {
          const skills = Array.isArray(activityForSkill.skills) ? activityForSkill.skills as Record<string, unknown>[] : [];
          const skillIndex = skills.findIndex((s: Record<string, unknown>) => s.name === data.skillName);
          
          if (skillIndex !== -1) {
            skills[skillIndex] = {
              ...skills[skillIndex],
              score: data.score,
              level: data.level,
              lastAssessed: new Date().toISOString()
            };
            
            result = await prisma.userActivity.update({
              where: { userId },
              data: { skills: JSON.parse(JSON.stringify(skills)) }
            });
          }
        }
        break;

      case 'addRecommendation':
        const activityForAdd = await prisma.userActivity.findUnique({
          where: { userId }
        });
        
        const currentRecommendations = Array.isArray(activityForAdd?.recommendations) ? activityForAdd.recommendations : [];
        
        result = await prisma.userActivity.update({
          where: { userId },
          data: { 
            recommendations: [...currentRecommendations, data.recommendation]
          }
        });
        break;

      case 'removeRecommendation':
        const activityForRemoveRec = await prisma.userActivity.findUnique({
          where: { userId }
        });
        
        if (activityForRemoveRec && activityForRemoveRec.recommendations) {
          const recommendations = Array.isArray(activityForRemoveRec.recommendations) ? activityForRemoveRec.recommendations : [];
          const updatedRecommendations = recommendations.filter((r: unknown) => r !== data.recommendation);
          
          result = await prisma.userActivity.update({
            where: { userId },
            data: { recommendations: updatedRecommendations }
          });
        }
        break;

      case 'updateLearningStats':
        const currentLearningStats = await prisma.userActivity.findUnique({
          where: { userId },
          select: { learningStats: true }
        });
        
        const existingStats = currentLearningStats?.learningStats as Record<string, unknown> || {};
        const updatedStats = {
          ...existingStats,
          streak: data.streak,
          totalStudyTime: data.totalStudyTime
        };
        
        result = await prisma.userActivity.update({
          where: { userId },
          data: { learningStats: updatedStats }
        });
        break;

      case 'resetProgress':
        result = await prisma.userActivity.update({
          where: { userId },
          data: {
            activities: [],
            skills: [],
            learningStats: {
              streak: 0,
              totalStudyTime: 0,
              weeklyStudyTime: 0,
              monthlyStudyTime: 0
            },
            progressHistory: [],
            strengths: [],
            weaknesses: [],
            recommendations: []
          }
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (!result) {
      return NextResponse.json({ error: "User activity not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "User activity updated successfully",
      userActivity: result
    });

  } catch (error) {
    console.error("Error updating user activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Delete user activity
    const result = await prisma.userActivity.delete({
      where: { userId }
    });

    if (!result) {
      return NextResponse.json({ error: "User activity not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "User activity deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting user activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
