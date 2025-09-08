import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
// Simplified: no mapping helpers

export async function POST(req: Request) {
  try {
    const { field, level, topic, questionCount = 4 } = await req.json();

    if (!field || !level) {
      return NextResponse.json(
        { error: 'Field and level are required' },
        { status: 400 }
      );
    }

    // Build where clause (direct mapping only)
    const where: Prisma.QuestionWhereInput = {};
    if (field) {
      // Accept shorthand common names
      const fieldMapping: Record<string, string> = {
        'Frontend': 'Frontend Development',
        'Backend': 'Backend Development',
        'Full Stack': 'Full Stack Development'
      };
      const mappedField = fieldMapping[field] || field;
      where.fields = { hasSome: [mappedField] };
    }
    if (topic) {
      where.topics = { hasSome: [topic] };
    }
    if (level) {
      const levelMap: Record<string, 'junior' | 'middle' | 'senior'> = {
        Intern: 'junior',
        Junior: 'junior',
        Mid: 'middle',
        Senior: 'senior',
        Lead: 'senior',
        junior: 'junior',
        middle: 'middle',
        senior: 'senior'
      };
      const normalized = levelMap[level as keyof typeof levelMap];
      if (!normalized) {
        return NextResponse.json(
          { error: `Invalid level: ${level}` },
          { status: 400 }
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where.levels = { hasSome: [normalized] as any };
    }

    // Get questions from database (only id & question)
    const questions = await prisma.question.findMany({
      where,
      take: questionCount * 2,
      orderBy: { createdAt: 'desc' },
      select: { id: true, question: true }
    });

    if (questions.length === 0) {
      return NextResponse.json(
        { error: `No questions found for field: ${field}, level: ${level}, topic: ${topic || 'any'}` },
        { status: 404 }
      );
    }

    // Randomly select the required number of questions
    const selectedQuestions = questions
      .sort(() => Math.random() - 0.5) // Shuffle
      .slice(0, questionCount);

    // Minimal response: only questions (id, question)
    const questionsForInterview = selectedQuestions.map(q => ({ id: q.id, question: q.question }));

    return NextResponse.json({
      questions: questionsForInterview,
      usedQuestionIds: questionsForInterview.map(q => q.id),
      jobRoleMapping: null
    });

  } catch (error) {
    console.error('Error creating interview context:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
