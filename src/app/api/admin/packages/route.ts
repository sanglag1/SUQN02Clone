import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// GET /api/admin/packages - Lấy danh sách tất cả packages (chỉ admin)
export async function GET() {
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

    const packages = await prisma.servicePackage.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      packages,
      total: packages.length
    });
  } catch (error) {
    console.error('Error fetching service packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service packages' },
      { status: 500 }
    );
  }
}

// POST /api/admin/packages - Tạo package mới (chỉ admin)
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const {
      name,
      price,
      duration,
      avatarInterviewLimit,
      testQuizEQLimit,
      jdUploadLimit,
      description,
      isActive
    } = body;

    // Validation
    if (!name || typeof price !== 'number' || typeof duration !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: name, price, duration' },
        { status: 400 }
      );
    }

    // Kiểm tra package name đã tồn tại chưa
    const existingPackage = await prisma.servicePackage.findFirst({
      where: { name }
    });

    if (existingPackage) {
      return NextResponse.json(
        { error: 'Package name already exists' },
        { status: 409 }
      );
    }

    const newPackage = await prisma.servicePackage.create({
      data: {
        name,
        price,
        duration,
        avatarInterviewLimit: avatarInterviewLimit || 0,
        testQuizEQLimit: testQuizEQLimit || 0,
        jdUploadLimit: jdUploadLimit || 0,
        description: description || '',
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json({
      package: newPackage,
      message: 'Package created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating service package:', error);
    return NextResponse.json(
      { error: 'Failed to create service package' },
      { status: 500 }
    );
  }
}
