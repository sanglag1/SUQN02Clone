import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(question);
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Find the user by clerkId with role information
    const user = await prisma.user.findUnique({ 
      where: { clerkId: userId },
      include: { role: true }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (user.role?.name !== 'admin') {
      return NextResponse.json({ error: 'Only admin can update questions' }, { status: 403 });
    }
    const body = await req.json();
    const { question, answers, fields, topics, levels, explanation } = body;
    // Validate at least one correct answer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasCorrectAnswer = (answers as any[]).some((answer) => answer.isCorrect);
    if (!hasCorrectAnswer) {
      return NextResponse.json(
        { error: 'At least one answer must be marked as correct' },
        { status: 400 }
      );
    }
    // Validate at least one field, topic and level
    if (!fields || fields.length === 0) {
      return NextResponse.json(
        { error: 'At least one field must be selected' },
        { status: 400 }
      );
    }
    if (!topics || topics.length === 0) {
      return NextResponse.json(
        { error: 'At least one topic must be selected' },
        { status: 400 }
      );
    }
    if (!levels || levels.length === 0) {
      return NextResponse.json(
        { error: 'At least one level must be selected' },
        { status: 400 }
      );
    }
    const { id } = await params;
    const existingQuestion = await prisma.question.findUnique({ where: { id } });
    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        question,
        answers,
        fields,
        topics,
        levels,
        explanation,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Find the user by clerkId with role information
    const user = await prisma.user.findUnique({ 
      where: { clerkId: userId },
      include: { role: true }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (user.role?.name !== 'admin') {
      return NextResponse.json({ error: 'Only admin can delete questions' }, { status: 403 });
    }
    const { id } = await params;
    const existingQuestion = await prisma.question.findUnique({ where: { id } });
    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    await prisma.question.delete({ where: { id } });
    return NextResponse.json(
      { message: 'Question deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}