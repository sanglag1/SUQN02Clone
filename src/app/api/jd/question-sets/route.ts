// api/question-sets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Lấy tất cả question sets của user
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const questionSets = await prisma.jdQuestions.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20, // Giới hạn 20 bộ câu hỏi gần nhất
      select: {
        id: true,
        userId: true,
        jobTitle: true,
        questionType: true,
        level: true,
        questions: true,
        fileName: true,
        createdAt: true,
        updatedAt: true
        // Không trả về originalJDText để giảm size
      }
    });

    return NextResponse.json({ 
      success: true, 
      questionSets 
    });

  } catch (error) {
    console.error('Error fetching question sets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Tạo mới question set
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      jobTitle, 
      questionType, 
      level, 
      questions, 
      originalJDText, 
      fileName 
    } = body;

    // Validation
    if (!jobTitle || !questionType || !level || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const questionSet = await prisma.jdQuestions.create({
      data: {
        userId,
        jobTitle: jobTitle.trim(),
        questionType,
        level,
        questions,
        originalJDText,
        fileName
      }
    });

    return NextResponse.json({ 
      success: true, 
      questionSet: {
        id: questionSet.id,
        jobTitle: questionSet.jobTitle,
        questionType: questionSet.questionType,
        level: questionSet.level,
        questions: questionSet.questions,
        fileName: questionSet.fileName,
        createdAt: questionSet.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating question set:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
