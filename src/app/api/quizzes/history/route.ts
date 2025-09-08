import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';



export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return (NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    // Tìm user theo clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    if (!user) {
      return (NextResponse.json({ error: 'User not found' }, { status: 404 }));
    }

    // Lấy danh sách quiz history của user với đầy đủ thông tin
    const quizHistory = await prisma.quiz.findMany({
      where: { 
        userId: user.id,
        completedAt: { not: null } // Chỉ lấy những quiz đã hoàn thành
      },
      orderBy: { completedAt: 'desc' },
      include: { 
        questions: {
          select: {
            id: true,
            question: true,
            answers: true,
            explanation: true
          }
        }
      },
    });

    // Transform data để phù hợp với UI
    const transformedHistory = quizHistory.map(quiz => {
      // Tính toán số câu trả lời đúng
      const userAnswers = quiz.userAnswers as Array<{ questionId: string; answerIndex: number[]; isCorrect: boolean }> || [];
      const correctAnswers = userAnswers.filter(answer => answer.isCorrect).length;
      
      // Tính toán score nếu chưa có
      const calculatedScore = quiz.score || (quiz.totalQuestions > 0 ? Math.round((correctAnswers / quiz.totalQuestions) * 100) : 0);

      return {
        id: quiz.id,
        field: quiz.field,
        topic: quiz.topic,
        level: quiz.level,
        completedAt: quiz.completedAt?.toISOString(),
        score: calculatedScore,
        timeUsed: quiz.timeUsed,
        timeLimit: quiz.timeLimit,
        userAnswers: userAnswers.map(answer => ({
          questionId: answer.questionId,
          answerIndex: answer.answerIndex || [],
          isCorrect: answer.isCorrect
        })),
        totalQuestions: quiz.totalQuestions,
        retryCount: quiz.retryCount || 0,
        questions: quiz.questions.map(question => ({
          id: question.id,
          question: question.question,
          answers: question.answers as Array<{ content: string; isCorrect?: boolean }> || [],
          explanation: question.explanation
        }))
      };
    });

    // Calculate stats
    const stats = {
      totalQuizzes: transformedHistory.length,
      completedQuizzes: transformedHistory.length,
      averageScore: transformedHistory.length > 0 
        ? Math.round(transformedHistory.reduce((sum, quiz) => sum + quiz.score, 0) / transformedHistory.length)
        : 0,
      byField: {} as Record<string, number>,
      byLevel: {} as Record<string, number>,
      byTopic: {} as Record<string, number>,
      recentQuizzes: transformedHistory.filter(quiz => {
        const quizDate = new Date(quiz.completedAt!);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return quizDate >= weekAgo;
      }).length
    };

    // Calculate byField, byLevel, byTopic
    transformedHistory.forEach(quiz => {
      stats.byField[quiz.field] = (stats.byField[quiz.field] || 0) + 1;
      stats.byLevel[quiz.level] = (stats.byLevel[quiz.level] || 0) + 1;
      stats.byTopic[quiz.topic] = (stats.byTopic[quiz.topic] || 0) + 1;
    });

    return (NextResponse.json({
      quizzes: transformedHistory,
      stats
    }));
  } catch (error) {
    console.error('Error in GET /api/quizzes/history:', error);
    return (NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 }));
  }
} 