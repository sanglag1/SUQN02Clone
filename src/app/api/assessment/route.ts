import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { AssessmentType } from '@prisma/client';
import TrackingEventService from '@/services/trackingEventService';

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return new Response(null, { status: 200 });
}

export async function POST(request: NextRequest) {
  const start = Date.now();
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type = 'test', jobRoleId, position, topic, history, ...rest } = body;

    // Kiểm tra type hợp lệ (chỉ còn 'test')
    if (type !== 'test') {
      const ms = Date.now() - start;
      console.log(`POST /api/assessment 400 in ${ms}ms`);
      return NextResponse.json({ error: 'Invalid type. Must be "test"' }, { status: 400 });
    }

    // Tìm database user
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    // Kiểm tra hạn mức sử dụng trước khi tạo assessment
    const activeUserPackage = await prisma.userPackage.findFirst({
      where: {
        userId: dbUser.id,
        isActive: true,
        endDate: { gte: new Date() }
      },
      include: { servicePackage: true }
    });

    if (!activeUserPackage) {
      return NextResponse.json({ 
        error: 'No active service package found. Please purchase a package to continue.' 
      }, { status: 403 });
    }

    // Kiểm tra hạn mức testQuizEQ (credit system: testQuizEQUsed = số lần còn lại)
    const remaining = activeUserPackage.testQuizEQUsed;
    const limit = activeUserPackage.servicePackage.testQuizEQLimit;
    const actualUsed = limit - remaining;
    
    if (remaining <= 0) {
      return NextResponse.json({ 
        error: `Test/EQ usage exceeded: ${actualUsed}/${limit}. Please upgrade your package.` 
      }, { status: 403 });
    }

    // Xây dựng data object với các trường bắt buộc
    const data = {
      userId,
      type: type as AssessmentType,
      level: rest.level || 'Junior', // Default level if not provided
      duration: rest.duration || 15, // Default duration if not provided
      totalTime: rest.totalTime || 0, // Use totalTime from request body or default to 0
      selectedCategory: rest.selectedCategory || null, // Optional category
      // Chỉ include các trường hợp lệ cho Assessment model
      ...(rest.history && { history: rest.history }),
      ...(rest.realTimeScores && { realTimeScores: rest.realTimeScores }),
      ...(rest.finalScores && { finalScores: rest.finalScores }),
      // Loại bỏ các trường không hợp lệ như status, category
    };

    // Xử lý topic cho test mode - lưu vào realTimeScores
    if (type === 'test' && topic) {
      if (data.realTimeScores) {
        data.realTimeScores = {
          ...JSON.parse(JSON.stringify(data.realTimeScores)),
          topic
        };
      } else {
        data.realTimeScores = { topic };
      }
    }

    // Xử lý job role - ưu tiên jobRoleId, sau đó position string
    if (jobRoleId) {
      const jobRoleRecord = await prisma.jobRole.findUnique({
        where: { id: jobRoleId }
      });
      if (!jobRoleRecord) {
        const ms = Date.now() - start;
        console.log(`POST /api/assessment 400 in ${ms}ms`);
        return NextResponse.json({ error: 'Position not found' }, { status: 400 });
      }
      data.jobRoleId = jobRoleId;
    } else if (position) {
      // Tìm hoặc tạo jobRole mới
      let jobRoleRecord = await prisma.jobRole.findFirst({
        where: { title: position }
      });
      
      if (!jobRoleRecord) {
        jobRoleRecord = await prisma.jobRole.create({
          data: {
            key: position.toLowerCase().replace(/\s+/g, '_'),
            title: position,
            level: 'Junior',
            description: position,
            order: 0,
            minExperience: 0,
            maxExperience: null
          }
        });
      }
      data.jobRoleId = jobRoleRecord.id;
    }

    // EQ mode removed: no EQ-specific score calculation

    console.log(`[Assessment API] Creating assessment with type: "${type}"`);
    const assessment = await prisma.assessment.create({
      data,
      include: {
        jobRole: true,
      },
    });

    // Cập nhật usage count sau khi tạo assessment thành công (credit system: giảm số lần còn lại)
    if (type === 'test') {
      const newRemaining = Math.max(0, activeUserPackage.testQuizEQUsed - 1);
      await prisma.userPackage.update({
        where: { id: activeUserPackage.id },
        data: {
          testQuizEQUsed: newRemaining
        }
      });
      console.log(`[Assessment API] Decremented testQuizEQ remaining: ${activeUserPackage.testQuizEQUsed} -> ${newRemaining}`);
    }
    // Track assessment completion via event system only when finalScores are present
    if (type === 'test' && data.finalScores && data.finalScores.overall !== undefined) {
      try {
        await TrackingEventService.trackAssessmentCompleted({
          userId: dbUser.id,
          assessmentId: assessment.id,
          level: assessment.level,
          totalTimeSeconds: assessment.totalTime || 0,
          overallScore: Number((assessment.finalScores as any)?.overall ?? data.finalScores.overall ?? 0),
          jobRoleId: assessment.jobRoleId,
          history: assessment.history,
          realTimeScores: assessment.realTimeScores,
          finalScores: assessment.finalScores,
        });
        console.log(`[Assessment API] Event-tracked ${type} completion for user ${dbUser.id}`);
      } catch (trackingError) {
        console.error(`[Assessment API] Error tracking (events) ${type} completion:`, trackingError);
      }
    } else {
      console.log(`[Assessment API] Skipping tracking for ${type} assessment ${assessment.id} - no final scores yet`);
    }

    // Response for test mode (only mode supported)
    const responseData = {
      ...assessment,
      userId,
      clerkId: userId,
      dbUserId: dbUser.id
    };
    return NextResponse.json(responseData, { status: 201 });

  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json({ 
      error: 'Lưu kết quả thất bại', 
      detail: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get('type'); // 'test'
    const limitParam = searchParams.get('limit');

    // Nếu có type, filter theo type. Nếu không, lấy tất cả
    const where = {
      userId,
      ...(typeParam === 'test' ? { type: typeParam as AssessmentType } : {})
    };

    interface QueryOptions {
      where: {
        userId: string;
        type?: AssessmentType;
      };
      include: {
        jobRole: boolean;
      };
      orderBy: {
        createdAt: 'desc';
      };
      take?: number;
    }

    const queryOptions: QueryOptions = {
      where,
      include: {
        jobRole: true, // Include jobRole data
      },
      orderBy: { createdAt: 'desc' },
    };

    // Apply limit if specified
    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      if (!isNaN(limit) && limit > 0) {
        queryOptions.take = limit;
      }
    }

    const assessments = await prisma.assessment.findMany(queryOptions);

    // Return assessments (only 'test' supported)
    return NextResponse.json(assessments);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json({ 
      error: 'Lấy kết quả thất bại', 
      detail: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
