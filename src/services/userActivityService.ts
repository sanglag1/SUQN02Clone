// Đã xoá tất cả các dòng console.log trong file

import prisma from '@/lib/prisma';
import type { 
  UserActivity as PrismaUserActivity,
  ActivityType,
  SkillLevel,
  GoalStatus,
  Prisma
} from '@prisma/client';

// JSON field types
interface IEvaluation {
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  overallRating: number;
  recommendations: string[];
}

interface IActivity {
  type: ActivityType;
  referenceId?: string;
  score?: number;
  duration: number;
  timestamp: Date | string;
  skillScores?: Record<string, number>;
}

interface ISkill {
  name: string;
  score: number;
  level: SkillLevel;
  category?: string;
  lastAssessed: string;
}

interface IGoal {
  id?: string;
  title: string;
  description?: string;
  targetDate?: string;
  status: GoalStatus;
  type: string;
  completedDate?: string;
}

interface ILearningStats {
  totalStudyTime: number;
  weeklyStudyTime: number;
  monthlyStudyTime: number;
  streak: number;
  lastStudyDate: string;
}

// Helper function to safely parse JSON fields
function parseJsonField<T>(field: Prisma.JsonValue | undefined | null, defaultValue: T): T {
  if (!field) return defaultValue;
  try {
    return typeof field === 'string' ? JSON.parse(field) : field as T;
  } catch {
    return defaultValue;
  }
}

export class UserActivityService {
  private static formatDate(date: Date): string {
    return date.toISOString();
  }

  private static parseDate(dateStr: string): Date {
    return new Date(dateStr);
  }

  static async initializeUserActivity(userId: string): Promise<PrismaUserActivity | null> {
    try {
      if (!userId || userId.trim() === '') {
        return null;
      }
      try {
        const existingActivity = await prisma.userActivity.findUnique({
          where: { userId }
        });
        if (existingActivity) {
          return existingActivity;
        }
      } catch {
      }
      try {
        const userExists = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true }
        });
        if (!userExists) {
          return null;
        }
      } catch {
      }
      const initialData = {
        activities: [],
        skills: [],
        goals: [],
        learningStats: {
          totalStudyTime: 0,
          weeklyStudyTime: 0,
          monthlyStudyTime: 0,
          streak: 0,
          lastStudyDate: this.formatDate(new Date())
        }
      };
      try {
        const userActivity = await prisma.userActivity.create({
          data: {
            userId,
            activities: initialData.activities as Prisma.JsonArray,
            skills: initialData.skills as Prisma.JsonArray,
            goals: initialData.goals as Prisma.JsonArray,
            learningStats: initialData.learningStats as Prisma.JsonObject
          }
        });
        return userActivity;
      } catch (createError) {
        const error = createError as { name?: string; code?: string };
        if (error?.name === 'PrismaClientKnownRequestError' && error?.code === 'P2003') {
        } else {
        }
        return null;
      }
    } catch {
      return null;
    }
  }

  static async trackInterviewActivity(userId: string, interviewId: string): Promise<void> {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId }
    });
    if (!interview || interview.status !== 'completed') {
      throw new Error('Interview not found or not completed');
    }
    const evaluation = parseJsonField<IEvaluation>(interview.evaluation, {
      technicalScore: 0,
      communicationScore: 0,
      problemSolvingScore: 0,
      overallRating: 0,
      recommendations: []
    });
    const skillAssessment = parseJsonField<Record<string, number>>(interview.skillAssessment, {});
    const durationMinutes = Math.max(1, Math.ceil((interview.duration || 0) / 60));
    const timestamp = this.formatDate(new Date());
    const activity: IActivity = {
      type: 'interview' as ActivityType,
      referenceId: interviewId,
      score: evaluation.overallRating,
      duration: durationMinutes,
      timestamp,
      skillScores: skillAssessment
    };
    const userActivity = await prisma.userActivity.findUnique({
      where: { userId }
    });
    if (!userActivity) {
      const skills = this.convertEvaluationToSkills(evaluation, timestamp);
      await prisma.userActivity.create({
        data: {
          userId,
          activities: JSON.parse(JSON.stringify([activity])),
          learningStats: {
            totalStudyTime: durationMinutes,
            weeklyStudyTime: durationMinutes,
            monthlyStudyTime: durationMinutes,
            streak: 1,
            lastStudyDate: timestamp
          },
          skills: JSON.parse(JSON.stringify(skills))
        }
      });
      return;
    }
    const currentActivities = parseJsonField<IActivity[]>(userActivity.activities, []);
    const currentStats = parseJsonField<ILearningStats>(userActivity.learningStats, {
      totalStudyTime: 0,
      weeklyStudyTime: 0,
      monthlyStudyTime: 0,
      streak: 0,
      lastStudyDate: timestamp
    });
    const lastStudyDate = new Date(currentStats.lastStudyDate);
    const today = new Date();
    lastStudyDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24));
    let newStreak = currentStats.streak;
    if (diffDays === 0) {
      newStreak = Math.max(currentStats.streak, 1);
    } else if (diffDays === 1) {
      newStreak = currentStats.streak + 1;
    } else {
      newStreak = 1;
    }
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const weeklyActivities = currentActivities.filter(a => 
      new Date(a.timestamp) > oneWeekAgo
    );
    const monthlyActivities = currentActivities.filter(a => 
      new Date(a.timestamp) > oneMonthAgo
    );
    const weeklyTime = weeklyActivities.reduce((sum, a) => sum + (a.duration || 0), 0);
    const monthlyTime = monthlyActivities.reduce((sum, a) => sum + (a.duration || 0), 0);
    await prisma.userActivity.update({
      where: { userId },
      data: {
        activities: JSON.parse(JSON.stringify([...currentActivities, activity])),
        learningStats: {
          totalStudyTime: currentStats.totalStudyTime + durationMinutes,
          weeklyStudyTime: weeklyTime + durationMinutes,
          monthlyStudyTime: monthlyTime + durationMinutes,
          streak: newStreak,
          lastStudyDate: timestamp
        }
      }
    });
    await this.updateSkillsFromEvaluation(userId, evaluation, timestamp);
  }

  private static convertEvaluationToSkills(evaluation: IEvaluation, timestamp: string): ISkill[] {
    const skills: ISkill[] = [
      {
        name: 'Technical',
        score: evaluation.technicalScore,
        level: this.getSkillLevel(evaluation.technicalScore),
        lastAssessed: timestamp
      },
      {
        name: 'Communication',
        score: evaluation.communicationScore,
        level: this.getSkillLevel(evaluation.communicationScore),
        lastAssessed: timestamp
      },
      {
        name: 'Problem Solving',
        score: evaluation.problemSolvingScore,
        level: this.getSkillLevel(evaluation.problemSolvingScore),
        lastAssessed: timestamp
      }
    ];
    return skills;
  }

  private static getSkillLevel(score: number): SkillLevel {
    if (score >= 90) return 'expert';
    if (score >= 75) return 'advanced';
    if (score >= 60) return 'intermediate';
    return 'beginner';
  }

  private static async updateSkillsFromEvaluation(
    userId: string, 
    evaluation: IEvaluation,
    timestamp: string
  ): Promise<void> {
    const userActivity = await prisma.userActivity.findUnique({
      where: { userId }
    });
    if (!userActivity) {
      throw new Error('User activity not found');
    }
    const currentSkills = parseJsonField<ISkill[]>(userActivity.skills, []);
    const newSkills = this.convertEvaluationToSkills(evaluation, timestamp);
    const updatedSkills = newSkills.map(newSkill => {
      const existingSkill = currentSkills.find(s => s.name === newSkill.name);
      return existingSkill
        ? { ...existingSkill, ...newSkill }
        : newSkill;
    });
    await prisma.userActivity.update({
      where: { userId },
      data: {
        skills: JSON.parse(JSON.stringify(updatedSkills))
      }
    });
  }

  static async updateLearningStats(userId: string): Promise<void> {
    try {
      let userActivity = await prisma.userActivity.findUnique({
        where: { userId }
      });
      if (!userActivity) {
        try {
          userActivity = await this.initializeUserActivity(userId);
          return;
        } catch {
          userActivity = await prisma.userActivity.findUnique({
            where: { userId }
          });
          if (!userActivity) {
            throw new Error(`Failed to create UserActivity record for user ${userId} in updateLearningStats`);
          }
        }
      }
      const activities = parseJsonField<IActivity[]>(userActivity.activities, []);
      const learningStats = userActivity.learningStats as unknown as ILearningStats;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayActivities = activities.filter(a => {
        const d = new Date(a.timestamp);
        d.setHours(0, 0, 0, 0);
        const isToday = d.getTime() === today.getTime();
        const hasDuration = (a.duration || 0) > 0;
        return isToday && hasDuration;
      });
      let streak = learningStats.streak;
      if (todayActivities.length > 0 && streak === 0) {
        streak = 1;
      }
      const lastStudyDate = new Date(learningStats.lastStudyDate);
      lastStudyDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24));
      if (streak > 0) {
        if (diffDays === 1) {
          streak += 1;
        } else if (diffDays > 1) {
          streak = 0;
        }
      }
      const totalStudyTime = activities.reduce((sum, a) => sum + ((a.duration && a.duration > 0) ? a.duration : 0), 0);
      try {
        await prisma.userActivity.update({
          where: { userId },
          data: {
            learningStats: JSON.parse(JSON.stringify({
              ...learningStats,
              streak,
              totalStudyTime,
              lastStudyDate: today
            }))
          }
        });
      } catch (updateError) {
        throw updateError;
      }
    } catch {
      throw new Error('Failed to update skill');
    }
  }

  static async addGoal(userId: string, goal: IGoal): Promise<PrismaUserActivity> {
    const userActivity = await prisma.userActivity.findUnique({
      where: { userId }
    });
    const currentGoals = parseJsonField<IGoal[]>(userActivity?.goals, []);
    return await prisma.userActivity.update({
      where: { userId },
      data: {
        goals: JSON.parse(JSON.stringify([...currentGoals, goal]))
      }
    });
  }

  static async updateGoalStatus(
    userId: string, 
    goalId: string, 
    status: GoalStatus
  ): Promise<PrismaUserActivity> {
    const userActivity = await prisma.userActivity.findUnique({
      where: { userId }
    });
    const goals = parseJsonField<IGoal[]>(userActivity?.goals, []);
    const updatedGoals = goals.map(g => {
      if (g.id === goalId) {
        return {
          ...g,
          status,
          ...(status === 'completed' ? { completedDate: new Date() } : {})
        };
      }
      return g;
    });
    return await prisma.userActivity.update({
      where: { userId },
      data: {
        goals: JSON.parse(JSON.stringify(updatedGoals))
      }
    });
  }

  static async getProgressReport(userId: string) {
    try {
      const [userActivity, user] = await Promise.all([
        prisma.userActivity.findUnique({
          where: { userId }
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { firstName: true, lastName: true, email: true }
        })
      ]);
      if (!userActivity) {
        await this.initializeUserActivity(userId);
        return {
          user: {
            name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
            email: user?.email
          },
          stats: {
            totalInterviews: 0,
            averageScore: 0.0,
            studyStreak: 0,
            totalStudyTime: 0
          },
          recentActivities: [],
          skillProgress: [],
          goals: [],
          strengths: [],
          weaknesses: [],
          recommendations: [
            'Start with a practice interview to assess your current level',
            'Set up your learning goals in the dashboard',
            'Review available learning resources'
          ]
        };
      }
      const activities = parseJsonField<IActivity[]>(userActivity.activities, []);
      const learningStats = parseJsonField<ILearningStats>(userActivity.learningStats, {
        totalStudyTime: 0,
        weeklyStudyTime: 0,
        monthlyStudyTime: 0,
        streak: 0,
        lastStudyDate: new Date().toISOString()
      });
      const skills = parseJsonField<ISkill[]>(userActivity.skills, []);
      const progressHistory = parseJsonField<Array<{
        date: string;
        overallScore: number;
        skillScores: Record<string, number>;
      }>>(userActivity.progressHistory, []);
      const goals = parseJsonField<IGoal[]>(userActivity.goals, []);
      const totalInterviews = activities.filter(a => 
        a.type === 'interview' || a.type === 'quiz').length;
      const activitiesWithScore = activities.filter(a => a.score !== undefined && a.score !== null);
      const averageScore = activitiesWithScore.length > 0
        ? activitiesWithScore.reduce((sum, act) => sum + act.score!, 0) / activitiesWithScore.length
        : 0;
      const recentActivities = [...activities]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
      const skillProgress = skills.map(skill => ({
        name: skill.name,
        level: skill.level,
        score: skill.score,
        progress: progressHistory
          .filter(ph => skill.name in ph.skillScores)
          .map(ph => ({
            date: ph.date,
            score: ph.skillScores[skill.name]
          }))
      }));
      return {
        user: {
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
          email: user?.email
        },
        stats: {
          totalInterviews,
          averageScore,
          studyStreak: learningStats.streak,
          totalStudyTime: learningStats.totalStudyTime
        },
        recentActivities,
        allActivities: activities,
        skillProgress,
        goals,
        strengths: userActivity.strengths as string[] || [],
        weaknesses: userActivity.weaknesses as string[] || [],
        recommendations: userActivity.recommendations as string[] || [],
        allQuizActivities: activities.filter(a => (a.type as string) === 'quiz' || (a.type as string) === 'test')
      };
    } catch {
      return {
        user: {
          name: '',
          email: ''
        },
        stats: {
          totalInterviews: 0,
          averageScore: 0.0,
          studyStreak: 0,
          totalStudyTime: 0
        },
        recentActivities: [],
        skillProgress: [],
        goals: [],
        strengths: [],
        weaknesses: [],
        recommendations: [
          'Start with a practice interview to assess your current level',
          'Set up your learning goals in the dashboard', 
          'Review available learning resources'
        ]
      };
    }
  }

  static async generateRecommendations(userId: string): Promise<string[]> {
    try {
      let userActivity = await prisma.userActivity.findUnique({
        where: { userId }
      });
      if (!userActivity) {
        try {
          userActivity = await this.initializeUserActivity(userId);
          return [
            'Start with a practice interview to assess your current level',
            'Set up your learning goals in the dashboard',
            'Review available learning resources'
          ];
        } catch {
          userActivity = await prisma.userActivity.findUnique({
            where: { userId }
          });
          if (!userActivity) {
            throw new Error(`Failed to create UserActivity record for user ${userId} in generateRecommendations`);
          }
        }
      }
      const skills = parseJsonField<ISkill[]>(userActivity.skills, []);
      const weakSkills = skills.filter(skill => skill.score < 70).map(skill => skill.name);
      const learningStats = parseJsonField<ILearningStats>(userActivity.learningStats, {
        totalStudyTime: 0,
        weeklyStudyTime: 0,
        monthlyStudyTime: 0,
        streak: 0,
        lastStudyDate: new Date().toISOString()
      });
      const recommendations = [];
      if (weakSkills.length > 0) {
        recommendations.push(
          `Focus on improving: ${weakSkills.join(', ')}`,
          'Schedule more practice interviews in these areas'
        );
      }
      if (learningStats.streak < 3) {
        recommendations.push(
          'Try to maintain a consistent practice schedule',
          'Set daily learning goals to build momentum'
        );
      }
      if (recommendations.length === 0) {
        recommendations.push(
          'Complete more practice sessions to get personalized recommendations',
          'Try different topics to broaden your skills'
        );
      }
      try {
        await prisma.userActivity.update({
          where: { userId },
          data: {
            recommendations: JSON.parse(JSON.stringify(recommendations)),
            weaknesses: JSON.parse(JSON.stringify(weakSkills))
          }
        });
      } catch (updateError) {
        throw updateError;
      }
      return recommendations;
    } catch {
      return [
        'Start with a practice interview to assess your current level',
        'Set up your learning goals in the dashboard',
        'Review available learning resources'
      ];
    }
  }

  static async addActivity(userIdentifier: string, activity: Omit<IActivity, 'timestamp'> & { timestamp: Date | string }): Promise<void> {
    try {
      let userId: string;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUUID = uuidRegex.test(userIdentifier);
      if (isUUID) {
        userId = userIdentifier;
      } else {
        const user = await prisma.user.findUnique({
          where: { clerkId: userIdentifier },
          select: { id: true }
        });
        if (!user) {
          throw new Error(`User with clerkId ${userIdentifier} not found in database`);
        }
        userId = user.id;
      }
      const updatedActivity = {...activity};
      if (updatedActivity.type === 'quiz' && typeof updatedActivity.score === 'number' && updatedActivity.score > 10) {
        updatedActivity.score = Math.round(updatedActivity.score / 10);
      }
      if (updatedActivity.skillScores && (!updatedActivity.score || updatedActivity.score === 0)) {
        const skillScoreValues = Object.values(updatedActivity.skillScores);
        if (skillScoreValues.length > 0) {
          const totalScore = skillScoreValues.reduce((sum, score) => sum + score, 0);
          const averageScore = Math.round(totalScore / skillScoreValues.length);
          updatedActivity.score = averageScore;
        }
      }
      const formattedActivity = {
        ...updatedActivity,
        timestamp: typeof updatedActivity.timestamp === 'string' 
          ? updatedActivity.timestamp 
          : this.formatDate(updatedActivity.timestamp)
      };
      let userActivity = await prisma.userActivity.findUnique({
        where: { userId }
      });
      if (!userActivity) {
        try {
          userActivity = await this.initializeUserActivity(userId);
        } catch {
          userActivity = await prisma.userActivity.findUnique({
            where: { userId }
          });
          if (!userActivity) {
            throw new Error(`Failed to create UserActivity record for user ${userId}`);
          }
        }
        try {
          await prisma.userActivity.update({
            where: { userId },
            data: {
              activities: [formattedActivity] as unknown as Prisma.JsonArray
            }
          });
          await this.updateLearningStats(userId);
        } catch (updateError) {
          throw updateError;
        }
        return;
      }
      const currentActivities = parseJsonField<IActivity[]>(userActivity?.activities, []);
      try {
        await prisma.userActivity.update({
          where: { userId },
          data: {
            activities: [...currentActivities, formattedActivity] as unknown as Prisma.JsonArray
          }
        });
        await this.updateLearningStats(userId);
      } catch (updateError) {
        throw updateError;
      }
    } catch {
      throw new Error('Failed to update skill');
    }
  }

  static async updateSkill(userId: string, skillData: Partial<ISkill>): Promise<void> {
    try {
      const { name, score, lastAssessed } = skillData;
      let level: SkillLevel = 'beginner';
      if (score) {
        if (score >= 90) level = 'expert';
        else if (score >= 75) level = 'advanced';
        else if (score >= 60) level = 'intermediate';
      }
      let userActivity = await prisma.userActivity.findUnique({
        where: { userId }
      });
      if (!userActivity) {
        try {
          userActivity = await this.initializeUserActivity(userId);
        } catch {
          userActivity = await prisma.userActivity.findUnique({
            where: { userId }
          });
          if (!userActivity) {
            throw new Error(`Failed to create UserActivity record for user ${userId} in updateSkill`);
          }
        }
      }
      const currentSkills = parseJsonField<ISkill[]>(userActivity?.skills, []);
      const updatedSkills = currentSkills.map(s => 
        s.name === name
          ? { 
              ...s, 
              score: score || s.score, 
              level, 
              lastAssessed: lastAssessed 
                ? typeof lastAssessed === 'string' 
                  ? lastAssessed 
                  : this.formatDate(lastAssessed)
                : this.formatDate(new Date())
            }
          : s
      );
      if (name && !currentSkills.some(s => s.name === name)) {
        updatedSkills.push({
          name,
          score: score || 0,
          level,
          lastAssessed: lastAssessed 
            ? typeof lastAssessed === 'string' 
              ? lastAssessed 
              : this.formatDate(lastAssessed)
            : this.formatDate(new Date())
        });
      }
      try {
        await prisma.userActivity.update({
          where: { userId },
          data: {
            skills: updatedSkills as unknown as Prisma.JsonArray
          }
        });
      } catch (updateError) {
        throw updateError;
      }
    } catch {
      throw new Error('Failed to update skill');
    }
  }

  static async trackPracticeSession(
    userId: string,
    topic: string,
    duration: number,
    score?: number
  ): Promise<void> {
    const now = new Date();
    const timestamp = this.formatDate(now);
    await this.addActivity(userId, {
      type: 'practice' as ActivityType,
      score,
      duration,
      timestamp
    });
    if (score !== undefined) {
      await this.updateSkill(userId, {
        name: topic,
        score,
        lastAssessed: timestamp
      });
    }
    await this.updateLearningStats(userId);
  }

  static async trackGoalProgress(
    userId: string,
    goalId: string,
    status: GoalStatus
  ): Promise<void> {
    try {
      await this.updateGoalStatus(userId, goalId, status);
      if (status === 'completed') {
        await this.addActivity(userId, {
          type: 'goal_completed',
          timestamp: new Date(),
          duration: 0
        });
        await this.generateRecommendations(userId);
      } else if (status === 'in_progress') {
        await this.addActivity(userId, {
          type: 'goal_started',
          timestamp: new Date(),
          duration: 0
        });
      }
      await this.updateLearningStats(userId);
    } catch {
      throw new Error('Failed to update goal progress');
    }
  }

  static async getUserActivity(userId: string): Promise<PrismaUserActivity | null> {
    return await prisma.userActivity.findUnique({
      where: { userId }
    });
  }
}
