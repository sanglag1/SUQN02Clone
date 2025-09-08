import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the user by clerkId
    // const user = await User.findOne({ clerkId: userId }); // This line is removed as per the new_code
    // if (!user) {
    //   return NextResponse.json({ error: 'User not found' }, { status: 404 });
    // }

    const body = await req.json();
    const { question, answers, fields, topics, levels, explanation } = body;

    // Define the type for an answer object
    // type Answer = {
    //   text: string;
    //   isCorrect: boolean;
    //   [key: string]: unknown;
    // };

    // Ensure fields, topics and levels are always arrays
    const validatedFields = Array.isArray(fields) ? fields : [];
    const validatedTopics = Array.isArray(topics) ? topics : [];
    const validatedLevels = Array.isArray(levels) ? levels : [];

    // Validate at least one correct answer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasCorrectAnswer = (answers as any[]).some((answer) => answer.isCorrect);
    if (!hasCorrectAnswer) {
      return NextResponse.json(
        { error: 'At least one answer must be marked as correct' },
        { status: 400 }
      );
    }

    // Tạo câu hỏi mới bằng Prisma
    const newQuestion = await prisma.question.create({
      data: {
        question,
        answers,
        fields: validatedFields,
        topics: validatedTopics,
        levels: validatedLevels,
        explanation,
      },
    });

    return NextResponse.json(newQuestion, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const field = searchParams.get('field');
    const topic = searchParams.get('topic');
    const level = searchParams.get('level');
    const search = searchParams.get('search');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (field) where.fields = { has: field };
    if (topic) where.topics = { has: topic };
    if (level) where.levels = { has: level };
    if (search) {
      where.OR = [
        { question: { contains: search, mode: 'insensitive' } },
        { explanation: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.question.count({ where });
    const questions = await prisma.question.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      data: questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}