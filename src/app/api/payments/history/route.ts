import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve local user by id or clerkId
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await prisma.user.findFirst({ where: { clerkId: userId } });
    }
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const history = await prisma.paymentHistory.findMany({
      where: { userId: user.id },
      include: { servicePackage: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const result = history.map(h => ({
      id: h.id,
      orderCode: h.orderCode,
      amount: h.amount,
      refundAmount: h.refundAmount,
      description: h.description,
      status: h.status,
      paymentMethod: h.paymentMethod,
      transactionId: h.transactionId,
      checkoutUrl: h.checkoutUrl,
      qrCode: h.qrCode,
      paidAt: h.paidAt,
      createdAt: h.createdAt,
      servicePackage: h.servicePackage ? { id: h.servicePackage.id, name: h.servicePackage.name, price: h.servicePackage.price } : null,
    }));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json({ error: 'Failed to fetch payment history' }, { status: 500 });
  }
}


