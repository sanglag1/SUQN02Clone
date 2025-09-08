import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user info from Clerk
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress || '';

    // Merge strategy to avoid email unique conflicts (P2002)
    const existingByClerk = await prisma.user.findUnique({ where: { clerkId } });
    if (existingByClerk) {
      await prisma.user.update({
        where: { id: existingByClerk.id },
        data: {
          lastActivity: new Date(),
          isOnline: true,
          clerkSessionActive: true,
          // Keep profile data fresh if available
          email: email || existingByClerk.email,
          firstName: clerkUser?.firstName ?? existingByClerk.firstName ?? undefined,
          lastName: clerkUser?.lastName ?? existingByClerk.lastName ?? undefined,
          avatar: clerkUser?.imageUrl ?? existingByClerk.avatar ?? undefined,
        }
      });
    } else {
      const existingByEmail = email
        ? await prisma.user.findUnique({ where: { email } })
        : null;

      if (existingByEmail) {
        // Attach the new clerkId to existing email user
        await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            clerkId,
            lastActivity: new Date(),
            isOnline: true,
            clerkSessionActive: true,
            firstName: existingByEmail.firstName ?? clerkUser?.firstName ?? undefined,
            lastName: existingByEmail.lastName ?? clerkUser?.lastName ?? undefined,
            avatar: existingByEmail.avatar ?? clerkUser?.imageUrl ?? undefined,
          }
        });
      } else {
        await prisma.user.create({
          data: {
            clerkId,
            email: email || `${clerkId}@placeholder.local`,
            firstName: clerkUser?.firstName || null,
            lastName: clerkUser?.lastName || null,
            avatar: clerkUser?.imageUrl || null,
            roleId: 'user_role_id',
            lastActivity: new Date(),
            isOnline: true,
            clerkSessionActive: true,
            skills: []
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
