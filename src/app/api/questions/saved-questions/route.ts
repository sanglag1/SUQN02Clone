import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Tìm user theo clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        savedQuestions: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user.savedQuestions, { status: 200 });
  } catch (error) {
    console.error('Error fetching saved questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Lưu câu hỏi (nếu chưa có)
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { questionId } = await req.json();
    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { savedQuestions: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const alreadySaved = user.savedQuestions.some(q => q.id === questionId);
    if (!alreadySaved) {
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          savedQuestions: { 
            connect: [{ id: questionId }] 
          } 
        },
      });
    }
    return NextResponse.json({ message: 'Question saved successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error saving question:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Toggle lưu/bỏ lưu câu hỏi
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();

    
    const { questionId } = body;
    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required', received: body }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { savedQuestions: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const alreadySaved = user.savedQuestions.some(q => q.id === questionId);
    let message = '';
    
    if (alreadySaved) {
      // Remove question from saved list
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          savedQuestions: { 
            disconnect: [{ id: questionId }] 
          } 
        },
      });
      message = 'Question unsaved successfully';
    } else {
      // Add question to saved list
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          savedQuestions: { 
            connect: [{ id: questionId }] 
          } 
        },
      });
      message = 'Question saved successfully';
    }
    
    return NextResponse.json({ message }, { status: 200 });
  } catch (error) {
    console.error('Error toggling saved question:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 