import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await getAuth(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Tìm user trong database
    const user = await prisma.user.findFirst({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Lấy lịch sử thanh toán của user
    const paymentHistory = await prisma.paymentHistory.findMany({
      where: { userId: user.id },
      include: {
        servicePackage: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
            description: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: paymentHistory,
      total: paymentHistory.length
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch payment history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getAuth(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { orderCode, status } = body;

    if (!orderCode) {
      return NextResponse.json(
        { error: 'Order code is required' },
        { status: 400 }
      );
    }

    // Tìm user trong database
    const user = await prisma.user.findFirst({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Cập nhật trạng thái thanh toán
    const updatedPayment = await prisma.paymentHistory.updateMany({
      where: {
        orderCode: orderCode,
        userId: user.id
      },
      data: {
        status: status || 'pending',
        updatedAt: new Date()
      }
    });

    if (updatedPayment.count === 0) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment status updated successfully'
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update payment status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 