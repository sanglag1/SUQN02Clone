import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderCode = searchParams.get('orderCode');

    if (!orderCode) {
      return NextResponse.json({ success: false, error: 'orderCode is required' }, { status: 400 });
    }

    const paymentHistory = await prisma.paymentHistory.findFirst({
      where: { orderCode: String(orderCode) },
      include: {
        servicePackage: true,
        user: true,
      },
    });

    if (!paymentHistory) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    // Try to locate the corresponding (latest) UserPackage for this user & servicePackage
    const userPackage = await prisma.userPackage.findFirst({
      where: {
        userId: paymentHistory.userId,
        servicePackageId: paymentHistory.servicePackageId,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const data = {
      orderCode: paymentHistory.orderCode,
      amount: paymentHistory.amount,
      packageName: paymentHistory.servicePackage.name,
      duration: paymentHistory.servicePackage.duration,
      avatarInterviewLimit: paymentHistory.servicePackage.avatarInterviewLimit,
      testQuizEQLimit: paymentHistory.servicePackage.testQuizEQLimit,
      jdUploadLimit: paymentHistory.servicePackage.jdUploadLimit,
      startDate: userPackage?.startDate?.toISOString() ?? new Date().toISOString(),
      endDate: userPackage?.endDate?.toISOString() ?? new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


