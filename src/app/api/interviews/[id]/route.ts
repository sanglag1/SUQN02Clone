import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const clerkId = session?.userId;
    
    if (!clerkId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Find user by clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { id: interviewId } = await params;
    
    if (!interviewId) {
      return NextResponse.json(
        { error: 'Interview ID is required' },
        { status: 400 }
      );
    }

    // Check if interview exists and belongs to the user
    const interview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        userId: user.id
      }
    });

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the interview
    await prisma.interview.delete({
      where: {
        id: interviewId
      }
    });

    return NextResponse.json({
      message: 'Interview deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/interviews/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 