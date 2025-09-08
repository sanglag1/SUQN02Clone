import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

type ResourceType = 'avatar' | 'quiz' | 'jd';

function pickDecrementField(resource: ResourceType) {
  if (resource === 'avatar') return 'avatarInterviewUsed' as const;
  if (resource === 'quiz') return 'testQuizEQUsed' as const;
  return 'jdUploadUsed' as const;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getAuth(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { resource } = await req.json() as { resource: ResourceType };
    if (!resource || !['avatar', 'quiz', 'jd'].includes(resource)) {
      return NextResponse.json({ error: 'Invalid resource' }, { status: 400 });
    }

    // Resolve user by id or clerkId
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await prisma.user.findFirst({ where: { clerkId: userId } });
    }
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Find active packages (not expired)
    const activePackages = await prisma.userPackage.findMany({
      where: { userId: user.id, isActive: true, endDate: { gte: new Date() } },
      include: { servicePackage: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!activePackages.length) {
      return NextResponse.json({ error: 'No active package' }, { status: 402 });
    }

    const field = pickDecrementField(resource);

    const paidPackages = activePackages.filter(p => p.servicePackage.price > 0);
    const freePackages = activePackages.filter(p => p.servicePackage.price === 0);

    type PackageWithCounters = (typeof activePackages)[number] & {
      avatarInterviewUsed: number;
      testQuizEQUsed: number;
      jdUploadUsed: number;
    };
    const hasRemaining = (p: PackageWithCounters) => p[field] > 0;

    const target = (paidPackages as PackageWithCounters[]).find(hasRemaining) || (freePackages as PackageWithCounters[]).find(hasRemaining);

    if (!target) {
      return NextResponse.json({ error: 'No remaining usage for this resource' }, { status: 402 });
    }

    // Decrement remaining by 1, not below 0
    const newValue = Math.max(0, (target[field] as number) - 1);

    await prisma.userPackage.update({
      where: { id: target.id },
      data: { [field]: newValue } as Record<string, number>
    });

    return NextResponse.json({ success: true, packageId: target.id, resource, remaining: newValue });
  } catch (error) {
    console.error('Error consuming usage:', error);
    return NextResponse.json({ error: 'Failed to consume usage' }, { status: 500 });
  }
}


