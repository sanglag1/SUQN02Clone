import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionDuration, lastActivity } = await req.json();

    // Only update if significant activity (more than 1 minute)
    if (sessionDuration < 60000) {
      return NextResponse.json({ success: true, message: 'Activity too short to record' });
    }

    // Find user
    const user = await prisma.user.findUnique({ 
      where: { clerkId: userId } 
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user's last activity and total time (simple and fast)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastActivity: new Date(lastActivity),
        // You can add totalTimeSpent field to user model if needed
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Activity summary saved',
      sessionDuration: Math.round(sessionDuration / 1000) // seconds
    });

  } catch (error) {
    console.error('Error saving activity summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
