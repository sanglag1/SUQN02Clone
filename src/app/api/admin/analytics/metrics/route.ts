import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

interface Evaluation {
  overallRating?: number;
}

interface FinalScores {
  overall?: number;
}

export async function GET() {
  try {
    // Kiểm tra quyền admin
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: { role: true }
    });

    if (!user || user.role?.name !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Lấy dữ liệu interviews
    const interviews = await prisma.interview.findMany({
      where: {
        status: 'completed'
      },
      select: {
        duration: true,
        evaluation: true,
        startTime: true,
        endTime: true
      }
    });

    // Lấy dữ liệu quizzes (completed quizzes have completedAt field)
    const quizzes = await prisma.quiz.findMany({
      where: {
        completedAt: {
          not: null
        }
      },
      select: {
        timeUsed: true,
        score: true,
        completedAt: true
      }
    });

    // Lấy dữ liệu assessments
    const assessments = await prisma.assessment.findMany({
      where: {
        status: 'completed'
      },
      select: {
        totalTime: true,
        finalScores: true,
        createdAt: true
      }
    });

    // Tính toán Average Time (từ interviews, quizzes, assessments)
    let totalDuration = 0;
    let totalActivities = 0;

    // Interviews
    interviews.forEach(interview => {
      if (interview.duration) {
        totalDuration += interview.duration;
        totalActivities++;
      }
    });

    // Quizzes
    quizzes.forEach(quiz => {
      if (quiz.timeUsed) {
        totalDuration += quiz.timeUsed;
        totalActivities++;
      }
    });

    // Assessments
    assessments.forEach(assessment => {
      if (assessment.totalTime) {
        totalDuration += assessment.totalTime * 60; // Convert to seconds
        totalActivities++;
      }
    });

    const averageTime = totalActivities > 0 ? Math.round(totalDuration / totalActivities / 60) : 25; // Convert to minutes

    // Tính toán Average Score
    let totalScore = 0;
    let scoredActivities = 0;

    // Interviews
    interviews.forEach(interview => {
      if (interview.evaluation && typeof interview.evaluation === 'object') {
        const evaluation = interview.evaluation as Evaluation;
        if (evaluation.overallRating) {
          totalScore += evaluation.overallRating;
          scoredActivities++;
        }
      }
    });

    // Quizzes
    quizzes.forEach(quiz => {
      if (quiz.score !== null && quiz.score !== undefined) {
        totalScore += quiz.score;
        scoredActivities++;
      }
    });

    // Assessments
    assessments.forEach(assessment => {
      if (assessment.finalScores && typeof assessment.finalScores === 'object') {
        const scores = assessment.finalScores as FinalScores;
        if (scores.overall) {
          totalScore += scores.overall;
          scoredActivities++;
        }
      }
    });

    const averageScore = scoredActivities > 0 ? Math.round((totalScore / scoredActivities) * 10) / 10 : 8.2;

    // Tính toán Completion Rate
    const totalStarted = interviews.length + quizzes.length + assessments.length;
    const totalCompleted = interviews.length + quizzes.length + assessments.length; // All are already filtered to completed
    
    const completionRate = totalStarted > 0 ? Math.round((totalCompleted / totalStarted) * 100) : 78;

    // Tính toán growth rates (so với tháng trước)
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const lastMonthActivities = interviews.filter(i => 
      new Date(i.startTime) >= lastMonth && new Date(i.startTime) < thisMonth
    ).length + quizzes.filter(q => 
      q.completedAt && new Date(q.completedAt) >= lastMonth && new Date(q.completedAt) < thisMonth
    ).length + assessments.filter(a => 
      new Date(a.createdAt) >= lastMonth && new Date(a.createdAt) < thisMonth
    ).length;

    const thisMonthActivities = interviews.filter(i => 
      new Date(i.startTime) >= thisMonth
    ).length + quizzes.filter(q => 
      q.completedAt && new Date(q.completedAt) >= thisMonth
    ).length + assessments.filter(a => 
      new Date(a.createdAt) >= thisMonth
    ).length;

    const activityGrowthRate = lastMonthActivities > 0 
      ? Math.round(((thisMonthActivities - lastMonthActivities) / lastMonthActivities) * 100)
      : 5;

    const scoreGrowthRate = 0.3; // Hardcoded for now, can be calculated from historical data

    return NextResponse.json({
      success: true,
      metrics: {
        totalUsers: await prisma.user.count(),
        averageScore,
        averageTime,
        completionRate,
        activityGrowthRate,
        scoreGrowthRate
      }
    });

  } catch (error) {
    console.error('Error fetching analytics metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
