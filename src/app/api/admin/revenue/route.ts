import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';
import { PaymentStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await getAuth(req);
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { role: true }
    });

    if (!user || user.role.name !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get revenue data from PaymentHistory
    const payments = await prisma.paymentHistory.findMany({
      where: {
        status: PaymentStatus.success  // Only successful payments
      },
      include: {
        servicePackage: true,
        user: true
      },
      orderBy: {
        paidAt: 'desc'
      }
    });

    // Calculate revenue metrics
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalTransactions = payments.length;
    
    // Group by month for chart data
    const monthlyRevenue = new Map<string, number>();
    const monthlyTransactions = new Map<string, number>();
    
    payments.forEach(payment => {
      if (payment.paidAt) {
        const monthKey = payment.paidAt.toISOString().slice(0, 7); // YYYY-MM format
        monthlyRevenue.set(monthKey, (monthlyRevenue.get(monthKey) || 0) + payment.amount);
        monthlyTransactions.set(monthKey, (monthlyTransactions.get(monthKey) || 0) + 1);
      }
    });

    // Convert to chart data format
    const chartData = Array.from(monthlyRevenue.entries())
      .map(([month, revenue]) => ({
        month,
        revenue,
        transactions: monthlyTransactions.get(month) || 0,
        averageOrderValue: Math.round(revenue / (monthlyTransactions.get(month) || 1))
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months

    // Calculate growth rate (compare with previous month)
    const currentMonth = new Date().toISOString().slice(0, 7);
    const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
    
    const currentMonthRevenue = monthlyRevenue.get(currentMonth) || 0;
    const lastMonthRevenue = monthlyRevenue.get(lastMonth) || 0;
    const growthRate = lastMonthRevenue > 0 ? 
      Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0;

    // Most popular packages
    const packageStats = new Map<string, { count: number; revenue: number; name: string }>();
    payments.forEach(payment => {
      const key = payment.servicePackageId;
      if (!packageStats.has(key)) {
        packageStats.set(key, { 
          count: 0, 
          revenue: 0, 
          name: payment.servicePackage?.name || 'Unknown Package'
        });
      }
      const stats = packageStats.get(key)!;
      stats.count += 1;
      stats.revenue += payment.amount;
    });

    const topPackages = Array.from(packageStats.entries())
      .map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalTransactions,
        growthRate,
        averageOrderValue: totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0,
        chartData,
        topPackages,
        recentPayments: payments.slice(0, 10).map(payment => ({
          id: payment.id,
          amount: payment.amount,
          packageName: payment.servicePackage?.name || 'Unknown Package',
          userEmail: payment.user?.email || 'Unknown User',
          paidAt: payment.paidAt,
          status: payment.status
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching revenue data:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
