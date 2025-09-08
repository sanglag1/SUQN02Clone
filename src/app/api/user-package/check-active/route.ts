import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// Helper function để xử lý fallback to free package
async function handlePackageFallback(userId: string, currentPackage: {
    id: string;
    servicePackage: {
        price: number;
        name: string;
        avatarInterviewLimit: number;
        testQuizEQLimit: number;
        jdUploadLimit: number;
    };
    avatarInterviewUsed: number;
    testQuizEQUsed: number;
    jdUploadUsed: number;
}) {
    // Kiểm tra xem gói hiện tại có phải là gói trả phí không
    const isPaidPackage = currentPackage.servicePackage.price > 0;
    
    if (!isPaidPackage) {
        return { needsFallback: false };
    }

    // Kiểm tra xem có hết hạn mức không (avatarInterviewUsed = số lần còn lại)
    const hasExceededLimits = 
        currentPackage.avatarInterviewUsed <= 0 &&
        currentPackage.testQuizEQUsed <= 0 &&
        currentPackage.jdUploadUsed <= 0;

    if (!hasExceededLimits) {
        return { needsFallback: false };
    }


    // Tìm gói free
    const freePackage = await prisma.servicePackage.findFirst({
        where: {
            OR: [
                { price: 0 },
                { name: { contains: 'free', mode: 'insensitive' } }
            ],
            isActive: true
        }
    });

    if (!freePackage) {
        console.log('❌ Không tìm thấy gói free để fallback');
        return { needsFallback: false };
    }

    // Kiểm tra xem user đã có gói free chưa
    let fallbackUserPackage = await prisma.userPackage.findFirst({
        where: {
            userId,
            servicePackageId: freePackage.id,
            isActive: true,
            endDate: { gte: new Date() }
        },
        include: { servicePackage: true }
    });

    // Nếu chưa có gói free, tạo mới
    if (!fallbackUserPackage) {
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1); // Gói free 1 năm

        fallbackUserPackage = await prisma.userPackage.create({
            data: {
                userId,
                servicePackageId: freePackage.id,
                startDate: new Date(),
                endDate,
                isActive: true,
                // Set usage counters tương ứng với limit của ServicePackage
                avatarInterviewUsed: freePackage.avatarInterviewLimit,
                testQuizEQUsed: freePackage.testQuizEQLimit,
                jdUploadUsed: freePackage.jdUploadLimit
            },
            include: { servicePackage: true }
        });

    }

    // Deactivate gói trả phí hiện tại
    await prisma.userPackage.update({
        where: { id: currentPackage.id },
        data: { isActive: false }
    });

    console.log(`🔄 Fallback: User ${userId} switched from ${currentPackage.servicePackage.name} to ${freePackage.name}`);

    return {
        needsFallback: true,
        originalPackage: currentPackage,
        fallbackPackage: fallbackUserPackage
    };
}

// Helper function để tính toán usage đơn giản
function calculateUsage(remaining: number, serviceLimit: number) {
    const actualRemaining = Math.max(0, remaining); // Số lần còn lại (từ UserPackage)
    const actualUsed = serviceLimit - actualRemaining; // Đã dùng = Limit - Còn lại
    
    return {
        actualUsed,
        serviceLimit, // Limit từ ServicePackage
        remaining: actualRemaining,
        canUse: actualRemaining > 0,
        display: `${actualUsed}/${serviceLimit}`
    };
}

// GET - Check if user has active package
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
        let user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            // Thử tìm theo clerkId
            user = await prisma.user.findFirst({
                where: { clerkId: userId }
            });
        }

        if (!user) {
            return NextResponse.json({
                hasActivePackage: false,
                message: 'User not found in database.'
            });
        }

        // Tìm tất cả gói active còn hạn
        const activePackages = await prisma.userPackage.findMany({
            where: {
                userId: user.id,
                isActive: true,
                endDate: { gte: new Date() }
            },
            include: { servicePackage: true },
            orderBy: { createdAt: 'desc' }
        });

        // Ưu tiên gói trả phí cao nhất, nếu không có thì dùng gói free
        let activePackage = activePackages.find(pkg => pkg.servicePackage.price > 0);
        if (!activePackage) {
            activePackage = activePackages.find(pkg => pkg.servicePackage.price === 0);
        }

        // Logic sử dụng song song: ưu tiên gói trả phí, fallback về gói free
        const paidPackages = activePackages.filter(pkg => pkg.servicePackage.price > 0);
        const freePackages = activePackages.filter(pkg => pkg.servicePackage.price === 0);
        
        // Tìm gói trả phí có lượt còn lại (avatarInterviewUsed > 0 = còn lượt)
        const availablePaidPackage = paidPackages.find(pkg => 
            pkg.avatarInterviewUsed > 0 || pkg.testQuizEQUsed > 0 || pkg.jdUploadUsed > 0
        );
        
        // Tìm gói free có lượt còn lại (avatarInterviewUsed > 0 = còn lượt)
        const availableFreePackage = freePackages.find(pkg => 
            pkg.avatarInterviewUsed > 0 || pkg.testQuizEQUsed > 0 || pkg.jdUploadUsed > 0
        );
        
        // Debug log logic chọn gói
        console.log('Package selection logic:', {
            paidPackages: paidPackages.map(p => ({ name: p.servicePackage.name, ai: p.avatarInterviewUsed })),
            freePackages: freePackages.map(p => ({ name: p.servicePackage.name, ai: p.avatarInterviewUsed })),
            availablePaid: availablePaidPackage?.servicePackage.name,
            availableFree: availableFreePackage?.servicePackage.name
        });

        // Ưu tiên gói trả phí trước, nếu hết lượt thì dùng gói free
        if (availablePaidPackage) {
            activePackage = availablePaidPackage;
            console.log('Selected paid package:', availablePaidPackage.servicePackage.name);
        } else if (availableFreePackage) {
            activePackage = availableFreePackage;
            console.log('Selected free package:', availableFreePackage.servicePackage.name);
        } else {
            // Cả 2 gói đều hết lượt, chọn gói trả phí để hiển thị thông tin
            activePackage = paidPackages[0] || freePackages[0];
            console.log('Selected exhausted package:', activePackage?.servicePackage.name);
        }



        if (!activePackage) {
            console.log('No active package found for user');
            return NextResponse.json({
                hasActivePackage: false,
                message: 'Bạn chưa có gói dịch vụ hoặc gói đã hết hạn.'
            });
        }

        // Kiểm tra và xử lý fallback
        const fallbackResult = await handlePackageFallback(user.id, activePackage);
        
        if (fallbackResult.needsFallback && fallbackResult.fallbackPackage) {
            // Cập nhật activePackage với gói fallback
            activePackage = fallbackResult.fallbackPackage;
        }

        // Debug log trước khi tính toán
        console.log('Raw package data:', {
            avatarInterviewUsed: activePackage.avatarInterviewUsed,
            avatarInterviewLimit: activePackage.servicePackage.avatarInterviewLimit,
            packageName: activePackage.servicePackage.name
        });

        // Tính toán usage với credit system
        const avatarInterview = calculateUsage(
            activePackage.avatarInterviewUsed, 
            activePackage.servicePackage.avatarInterviewLimit
        );
        const testQuizEQ = calculateUsage(
            activePackage.testQuizEQUsed, 
            activePackage.servicePackage.testQuizEQLimit
        );
        const jdUpload = calculateUsage(
            activePackage.jdUploadUsed, 
            activePackage.servicePackage.jdUploadLimit
        );

        // Debug log kết quả tính toán
        console.log('Calculated usage:', {
            avatarInterview: {
                remaining: avatarInterview.remaining,
                canUse: avatarInterview.canUse,
                display: avatarInterview.display
            }
        });

        // Kiểm tra thời gian
        const isTimeValid = activePackage.endDate > new Date();
        const daysRemaining = Math.ceil(
            (new Date(activePackage.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        // Tính toán tổng usage từ cả 2 gói
        const totalUsage = {
            avatarInterview: {
                currentUsage: avatarInterview.actualUsed,
                serviceLimit: avatarInterview.serviceLimit,
                remaining: avatarInterview.remaining,
                canUse: isTimeValid && avatarInterview.canUse,
                display: avatarInterview.display
            },
            testQuizEQ: {
                currentUsage: testQuizEQ.actualUsed,
                serviceLimit: testQuizEQ.serviceLimit,
                remaining: testQuizEQ.remaining,
                canUse: isTimeValid && testQuizEQ.canUse,
                display: testQuizEQ.display
            },
            jdUpload: {
                currentUsage: jdUpload.actualUsed,
                serviceLimit: jdUpload.serviceLimit,
                remaining: jdUpload.remaining,
                canUse: isTimeValid && jdUpload.canUse,
                display: jdUpload.display
            }
        };

        // Debug log đầy đủ
        console.log('Calculated usage:', totalUsage);
        console.log('Package check response:', {
            hasActivePackage: isTimeValid && (avatarInterview.canUse || testQuizEQ.canUse || jdUpload.canUse),
            selectedPackage: activePackage.servicePackage.name,
            avatarInterviewCanUse: avatarInterview.canUse,
            avatarInterviewUsage: `${avatarInterview.actualUsed}/${avatarInterview.serviceLimit}`,
            testQuizEQCanUse: testQuizEQ.canUse,
            testQuizEQUsage: `${testQuizEQ.actualUsed}/${testQuizEQ.serviceLimit}`,
            timeValid: isTimeValid
        });

        // Trả về thông tin cả 2 gói
        return NextResponse.json({
            hasActivePackage: isTimeValid && (avatarInterview.canUse || testQuizEQ.canUse || jdUpload.canUse),
            selectedPackage: {
                id: activePackage.id,
                name: activePackage.servicePackage.name,
                price: activePackage.servicePackage.price,
                startDate: activePackage.startDate,
                endDate: activePackage.endDate,
                type: activePackage.servicePackage.price > 0 ? 'PAID' : 'FREE'
            },
            allPackages: activePackages.map(pkg => ({
                id: pkg.id,
                name: pkg.servicePackage.name,
                price: pkg.servicePackage.price,
                type: pkg.servicePackage.price > 0 ? 'PAID' : 'FREE',
                avatarInterviewUsed: pkg.avatarInterviewUsed,
                testQuizEQUsed: pkg.testQuizEQUsed,
                jdUploadUsed: pkg.jdUploadUsed,
                isActive: pkg.isActive,
                endDate: pkg.endDate
            })),
            usage: totalUsage,
            fallback: {
                isFallback: fallbackResult.needsFallback,
                originalPackage: fallbackResult.originalPackage,
                fallbackPackage: fallbackResult.fallbackPackage
            },
            timeInfo: {
                endDate: activePackage.endDate,
                daysRemaining: Math.max(0, daysRemaining),
                isTimeValid
            }
        });
    } catch (error) {
        console.error('Error checking active package:', error);
        return NextResponse.json(
            { 
                error: 'Failed to check active package',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 