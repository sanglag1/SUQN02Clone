import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Admin endpoint to get all JD question sets from all users
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { 
        role: {
          select: {
            name: true
          }
        }
      }
    });

    if (!user || user.role?.name !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get all JD question sets from all users (admin view)
    const questionSets = await prisma.jdQuestions.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        jobTitle: true,
        questionType: true,
        level: true,
        fileName: true,
        createdAt: true,
        updatedAt: true
        // Only select necessary fields for admin identification
      }
    });

    console.log(`🔧 Admin: Loaded ${questionSets.length} JD question sets for admin view`);

    return NextResponse.json({ 
      success: true, 
      questionSets 
    });

  } catch (error) {
    console.error('Error fetching admin JD question sets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
