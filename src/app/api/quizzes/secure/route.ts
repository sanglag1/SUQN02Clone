import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { QuizMappingService } from '@/hooks/useQuizMapping';

interface Question {
  id: string;
  question: string;
  answers: { content: string; isCorrect?: boolean }[];
  explanation?: string;
  isMultipleChoice?: boolean;
}



export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return (NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return (NextResponse.json({ error: 'User not found' }, { status: 404 }));
    }

    const { field, topic, level, count, timeLimit } = await req.json();

    // Validate input
    if (!field || !topic || !level || !count || !timeLimit) {
      return (NextResponse.json({ error: 'Missing required fields' }, { status: 400 }));
    }

    // 1. Lấy questions ngẫu nhiên từ database
    const questions = await prisma.question.findMany({
      where: {
        fields: { has: field },
        topics: { has: topic },
        levels: { has: level },
      },
      take: count,
      orderBy: {
        id: 'asc',
      },
    });

    if (questions.length === 0) {
      return (NextResponse.json({ error: 'No questions found for the specified criteria' }, { status: 404 }));
    }

    // 2. Xử lý shuffle questions và answers
    const { shuffledQuestions, answerMapping, questionsForUI } = QuizMappingService.processSecureQuiz(questions as unknown as Question[]);

    // Create quiz
    const quiz = await prisma.quiz.create({
      data: {
        userId: user.id,
        field,
        topic,
        level,
        questions: {
          connect: shuffledQuestions.map(q => ({ id: q.id })),
        },
        totalQuestions: questions.length,
        timeLimit,
        score: 0,
        timeUsed: 0,
        retryCount: 0,
        answerMapping,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      include: { questions: true },
    });

    // Update user's quiz history
    await prisma.user.update({
      where: { id: user.id },
      data: {
        quizHistory: {
          connect: { id: quiz.id },
        },
      },
    });

    // 5. Trả về quiz với questions đã shuffle (KHÔNG có isCorrect)
    const quizForUI = {
      ...quiz,
      questions: questionsForUI
    };

    return (NextResponse.json(quizForUI, { status: 201 }));
  } catch (error) {
    console.error('Error creating secure quiz:', error);
    return (NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
} 