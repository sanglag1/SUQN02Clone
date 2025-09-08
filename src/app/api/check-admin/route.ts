import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json({ isAdmin: false, reason: 'Not authenticated' });
    }

    // Check user role using Prisma
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: { role: true }
    });

    if (!user) {
      return NextResponse.json({ 
        isAdmin: false, 
        reason: 'User not found in database',
        clerkId: clerkUser.id 
      });
    }

    const isAdmin = user.role?.name === 'admin';

    return NextResponse.json({
      isAdmin,
      reason: isAdmin ? 'User is admin' : `User role is ${user.role?.name || 'none'}`,
      user: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        roleId: user.roleId,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({ 
      isAdmin: false, 
      reason: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
