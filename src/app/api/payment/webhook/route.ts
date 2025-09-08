import { WebhookType } from '@payos/node/lib/type';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function để tính toán hạn mức còn lại (đơn giản hóa)
function calculateRemainingLimits(oldPackages: Array<{
  endDate: Date;
  startDate: Date;
  servicePackage: {
    avatarInterviewLimit: number;
    testQuizEQLimit: number;
    jdUploadLimit: number;
    name: string;
    price: number;
  };
  avatarInterviewUsed: number;
  testQuizEQUsed: number;
  jdUploadUsed: number;
}>) {
  // Chỉ tính credit từ gói trả phí, bỏ qua gói free
  const paidPackages = oldPackages.filter(pkg => pkg.servicePackage.price > 0);
  
  let remainingAvatarInterviews = 0;
  let remainingTestQuizEQ = 0;
  let remainingJDUploads = 0;

  for (const oldPkg of paidPackages) {
    const now = new Date();
    const endDate = new Date(oldPkg.endDate);
    const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const totalDays = Math.ceil((endDate.getTime() - new Date(oldPkg.startDate).getTime()) / (1000 * 60 * 60 * 24));
    
    if (totalDays > 0) {
      const remainingRatio = daysLeft / totalDays;
      
      // avatarInterviewUsed = số lần còn lại
      const unusedAvatarInterviews = Math.max(0, oldPkg.avatarInterviewUsed);
      const unusedTestQuizEQ = Math.max(0, oldPkg.testQuizEQUsed);
      const unusedJDUploads = Math.max(0, oldPkg.jdUploadUsed);
      
      // Cộng dồn hạn mức còn lại
      remainingAvatarInterviews += Math.round(unusedAvatarInterviews * remainingRatio);
      remainingTestQuizEQ += Math.round(unusedTestQuizEQ * remainingRatio);
      remainingJDUploads += Math.round(unusedJDUploads * remainingRatio);
      
      console.log(`📊 Paid Package ${oldPkg.servicePackage.name}: AI=${Math.round(unusedAvatarInterviews * remainingRatio)}, EQ=${Math.round(unusedTestQuizEQ * remainingRatio)}, JD=${Math.round(unusedJDUploads * remainingRatio)}`);
    }
  }

  return { remainingAvatarInterviews, remainingTestQuizEQ, remainingJDUploads };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as WebhookType;
    const { success, data: { orderCode } } = body;

    console.log('Webhook received:', body);

    // Tìm PaymentHistory theo orderCode
    const paymentHistory = await prisma.paymentHistory.findFirst({
      where: { orderCode: String(orderCode) },
      include: { servicePackage: true, user: true }
    });

    if (!paymentHistory) {
      console.log('PaymentHistory not found for orderCode:', orderCode);
      return NextResponse.json({ success: true, error: 0, message: 'Ok' }, { status: 200 });
    }

    console.log('Found PaymentHistory:', paymentHistory.id);

    if (paymentHistory && success) {
      console.log('Payment successful, processing...');
      
      // Sử dụng transaction để đảm bảo consistency
      await prisma.$transaction(async (tx) => {
        // 1. Cập nhật PaymentHistory thành success
        await tx.paymentHistory.update({
          where: { id: paymentHistory.id },
          data: {
            status: 'success',
            transactionId: String(body.data?.orderCode || ''),
            paidAt: new Date()
          }
        });

        // 2. Lấy tất cả gói cũ active
        const oldUserPackages = await tx.userPackage.findMany({
          where: {
            userId: paymentHistory.userId,
            isActive: true,
            endDate: { gt: new Date() },
            servicePackageId: { not: paymentHistory.servicePackageId }
          },
          include: { servicePackage: true },
          orderBy: { endDate: 'desc' }
        });

        console.log(`🔍 Found ${oldUserPackages.length} old active packages`);

        // 3. Tính toán hạn mức còn lại
        const { remainingAvatarInterviews, remainingTestQuizEQ, remainingJDUploads } = calculateRemainingLimits(oldUserPackages);

        console.log(`📊 Total remaining to transfer: AI=${remainingAvatarInterviews}, EQ=${remainingTestQuizEQ}, JD=${remainingJDUploads}`);

        // 4. Tạo hoặc cập nhật UserPackage trả phí mới
        const now = new Date();
        const endDate = new Date(now.getTime() + paymentHistory.servicePackage.duration * 24 * 60 * 60 * 1000);

        const newPaidUserPackage = await tx.userPackage.upsert({
          where: {
            userId_servicePackageId: {
              userId: paymentHistory.userId,
              servicePackageId: paymentHistory.servicePackageId
            }
          },
          update: {
            startDate: now,
            endDate,
            isActive: true,
            // Set usage counters = limit của gói mới (không có credit)
            avatarInterviewUsed: paymentHistory.servicePackage.avatarInterviewLimit,
            testQuizEQUsed: paymentHistory.servicePackage.testQuizEQLimit,
            jdUploadUsed: paymentHistory.servicePackage.jdUploadLimit
          },
          create: {
            userId: paymentHistory.userId,
            servicePackageId: paymentHistory.servicePackageId,
            startDate: now,
            endDate,
            isActive: true,
            // Set usage counters = limit của gói mới (không có credit)
            avatarInterviewUsed: paymentHistory.servicePackage.avatarInterviewLimit,
            testQuizEQUsed: paymentHistory.servicePackage.testQuizEQLimit,
            jdUploadUsed: paymentHistory.servicePackage.jdUploadLimit
          }
        });

        // 4.1. Đảm bảo user luôn có gói free (nếu chưa có)
        const existingFreePackage = await tx.userPackage.findFirst({
          where: {
            userId: paymentHistory.userId,
            servicePackage: {
              price: 0
            },
            isActive: true
          }
        });

        if (!existingFreePackage) {
          // Tạo gói free mới nếu user chưa có
          const freeServicePackage = await tx.servicePackage.findFirst({
            where: {
              price: 0,
              isActive: true
            }
          });

          if (freeServicePackage) {
            const freeEndDate = new Date();
            freeEndDate.setFullYear(freeEndDate.getFullYear() + 1); // Gói free 1 năm

            await tx.userPackage.create({
              data: {
                userId: paymentHistory.userId,
                servicePackageId: freeServicePackage.id,
                startDate: now,
                endDate: freeEndDate,
                isActive: true,
                // Gói free: avatarInterviewUsed = 0 (hết lượt)
                avatarInterviewUsed: 0,
                testQuizEQUsed: 0,
                jdUploadUsed: 0
              }
            });
            console.log(`🆓 Created free package for user ${paymentHistory.userId}`);
          }
        }

        // 5. Deactivate tất cả gói trả phí cũ (giữ lại gói free để sử dụng song song)
        const paidPackagesToDeactivate = oldUserPackages.filter(pkg => pkg.servicePackage.price > 0);
        if (paidPackagesToDeactivate.length > 0) {
          await tx.userPackage.updateMany({
            where: {
              userId: paymentHistory.userId,
              isActive: true,
              id: { in: paidPackagesToDeactivate.map(pkg => pkg.id) }
            },
            data: { isActive: false }
          });
          console.log(`🔄 Deactivated ${paidPackagesToDeactivate.length} paid packages`);
        }
        
        // Gói free vẫn active để sử dụng song song
        const freePackages = oldUserPackages.filter(pkg => pkg.servicePackage.price === 0);
        if (freePackages.length > 0) {
          console.log(`🔄 Kept ${freePackages.length} free packages active for parallel usage`);
        }

        // 6. Log kết quả
        console.log(`✅ Payment processed successfully:`);
        console.log(`   - PaymentHistory ${paymentHistory.id} updated to success`);
        console.log(`   - New Paid UserPackage ${newPaidUserPackage.id} created/updated`);
        console.log(`   - ${paidPackagesToDeactivate.length} paid packages deactivated`);
        console.log(`   - Free packages preserved for parallel usage`);
        
        console.log(`📊 New package limits:`);
        console.log(`   - Avatar Interviews: ${paymentHistory.servicePackage.avatarInterviewLimit} uses`);
        console.log(`   - Test Quiz/EQ: ${paymentHistory.servicePackage.testQuizEQLimit} uses`);
        console.log(`   - JD Uploads: ${paymentHistory.servicePackage.jdUploadLimit} uses`);
        console.log(`ℹ️ No credit system - clean package limits`);
      });
    }

    return NextResponse.json({
      success: true,
      error: 0,
      message: 'Ok',
      data: body
    }, { status: 200 });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({
      success: true,
      error: 0,
      message: 'Ok'
    }, { status: 200 });
  }
}