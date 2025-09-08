import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// GET /api/admin/packages/analytics - Lấy dữ liệu analytics (chỉ admin)
export async function GET(req: NextRequest) {
  try {
    // Kiểm tra quyền admin
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: { role: true }
    });

    if (!user || user.role?.name !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Test: Kiểm tra data cơ bản
    const testData = {
      servicePackages: await prisma.servicePackage.count(),
      userPackages: await prisma.userPackage.count(),
      users: await prisma.user.count(),
      adminUsers: await prisma.user.count({
        where: {
          role: {
            name: 'admin'
          }
        }
      })
    };

    console.log('Debug - Test data:', testData);

    // Nếu không có data, trả về empty analytics
    if (testData.servicePackages === 0) {
      return NextResponse.json({
        totalPackages: 0,
        activePackages: 0,
        totalRevenue: 0,
        totalUsers: 0,
        packageUsage: [],
        expiringPackages: [],
        monthlyRevenue: []
      });
    }

    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('timeRange') || '30d';

    // Tính toán thời gian dựa trên timeRange
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Lấy tổng số packages
    const totalPackages = await prisma.servicePackage.count();
    const activePackages = await prisma.servicePackage.count({
      where: { isActive: true }
    });

    console.log('Debug - Total packages:', totalPackages);
    console.log('Debug - Active packages:', activePackages);

    // Lấy thông tin user packages
    const userPackages = await prisma.userPackage.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      include: {
        servicePackage: true,
        user: true
      }
    });

    console.log('Debug - User packages found:', userPackages.length);
    console.log('Debug - Time range:', timeRange, 'Start date:', startDate);

    // Tính toán revenue và user count
    const totalRevenue = userPackages.reduce((sum, up) => sum + (up.servicePackage?.price || 0), 0);
    const totalUsers = new Set(userPackages.map(up => up.userId)).size;

    // Thống kê theo package
    const packageStats = new Map();
    userPackages.forEach(up => {
      const packageId = up.servicePackageId;
      if (!packageStats.has(packageId)) {
        packageStats.set(packageId, {
          packageId,
          packageName: up.servicePackage?.name || 'Unknown',
          userCount: 0,
          revenue: 0,
          isActive: up.servicePackage?.isActive || false
        });
      }
      
      const stats = packageStats.get(packageId);
      stats.userCount++;
      stats.revenue += up.servicePackage?.price || 0;
    });

    const packageUsage = Array.from(packageStats.values());

    // Tìm packages sắp hết hạn (trong vòng 30 ngày tới)
    const expiringThreshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringUserPackages = await prisma.userPackage.findMany({
      where: {
        endDate: {
          lte: expiringThreshold,
          gte: now
        }
      },
      include: {
        servicePackage: true
      }
    });

    const expiringStats = new Map();
    expiringUserPackages.forEach(up => {
      const packageId = up.servicePackageId;
      if (!expiringStats.has(packageId)) {
        const daysUntilExpiry = Math.ceil((up.endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        expiringStats.set(packageId, {
          packageId,
          packageName: up.servicePackage?.name || 'Unknown',
          userCount: 0,
          daysUntilExpiry
        });
      }
      
      const stats = expiringStats.get(packageId);
      stats.userCount++;
    });

    const expiringPackages = Array.from(expiringStats.values());

    // Tạo dữ liệu monthly revenue (6 tháng gần nhất)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthRevenue = userPackages
        .filter(up => {
          const createdAt = new Date(up.createdAt);
          return createdAt >= monthStart && createdAt <= monthEnd;
        })
        .reduce((sum, up) => sum + (up.servicePackage?.price || 0), 0);

      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue
      });
    }

    return NextResponse.json({
      totalPackages,
      activePackages,
      totalRevenue,
      totalUsers,
      packageUsage,
      expiringPackages,
      monthlyRevenue
    });

  } catch (error) {
    console.error('Error fetching package analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
