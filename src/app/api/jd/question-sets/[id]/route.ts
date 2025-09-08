// api/question-sets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Lấy một question set cụ thể
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validate UUID format (Prisma uses UUID instead of ObjectId)
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid question set ID' },
        { status: 400 }
      );
    }

    const questionSet = await prisma.jdQuestions.findFirst({ 
      where: { 
        id, 
        userId 
      }
    });

    if (!questionSet) {
      return NextResponse.json(
        { error: 'Question set not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      questionSet 
    });

  } catch (error) {
    console.error('Error fetching question set:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa một question set
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validate UUID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid question set ID' },
        { status: 400 }
      );
    }

    // First check if the question set exists and belongs to the user
    const existingQuestionSet = await prisma.jdQuestions.findFirst({
      where: { 
        id,
        userId 
      }
    });

    if (!existingQuestionSet) {
      return NextResponse.json(
        { error: 'Question set not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    // Delete the question set
    await prisma.jdQuestions.delete({ 
      where: { 
        id
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Question set deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting question set:', error);
    
    // Handle Prisma specific errors
    if (error instanceof Error) {
      if (error.message.includes('Record to delete does not exist')) {
        return NextResponse.json(
          { error: 'Question set not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
