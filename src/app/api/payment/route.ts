
import { NextRequest, NextResponse } from 'next/server';
import payos from '@/lib/payos';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await getAuth(req);
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Tìm User theo clerkId
  const user = await prisma.user.findUnique({
    where: { clerkId }
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { servicePackageId } = await req.json();
  // Thiết lập returnUrl và cancelUrl
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const returnUrl = `${baseUrl}/payment-success`;
  const cancelUrl = `${baseUrl}/payment-cancel`;
  const servicePackage = await prisma.servicePackage.findUnique({ where: { id: servicePackageId } });
  if (!servicePackage) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Lấy tất cả gói active của user (có thể có cả free và paid)
  const userPackages = await prisma.userPackage.findMany({
    where: {
      userId: user.id,
      isActive: true,
      endDate: { gt: new Date() },
    },
    orderBy: { endDate: 'desc' },
    include: { servicePackage: true },
  });

  // Xác định gói trả phí đang được xem là "gói hiện tại": chọn gói có giá cao nhất trong số các gói trả phí đang active
  const paidPackages = userPackages.filter(pkg => pkg.servicePackage.price > 0);
  const paidPackage = paidPackages.sort((a, b) => b.servicePackage.price - a.servicePackage.price)[0];
  const freePackage = userPackages.find(pkg => pkg.servicePackage.price === 0);

  console.log(`📊 User packages: CurrentPaid=${paidPackage?.servicePackage?.name || 'None'}, Free=${freePackage?.servicePackage?.name || 'None'}`);

  // Kiểm tra nâng cấp hợp lệ
  if (paidPackage && paidPackage.servicePackage) {
    // Không cho phép mua lại gói đang dùng
    if (paidPackage.servicePackage.id === servicePackage.id) {
      return NextResponse.json({ error: 2, message: 'Bạn đang sử dụng gói này.' }, { status: 400 });
    }
    // Không cho phép nâng cấp xuống gói thấp hơn hoặc cùng cấp (chỉ cho phép lên gói giá cao hơn)
    if (servicePackage.price <= paidPackage.servicePackage.price) {
      return NextResponse.json({ error: 3, message: 'Chỉ được nâng cấp lên gói cao hơn.' }, { status: 400 });
    }
  }

  // Tính tiền nâng cấp: trừ THẲNG giá gói trả phí hiện tại (không prorate)
  // Ví dụ: 599,000 - 10,000 = 589,000
  let amount = servicePackage.price;
  let refundAmount = 0;
  if (paidPackage && paidPackage.servicePackage) {
    refundAmount = paidPackage.servicePackage.price;
    amount = Math.max(0, servicePackage.price - refundAmount);
  }
   
  const orderCode = Number(String(Date.now()).slice(-6));
  const description = servicePackage.name;

  try {
    // Tạo bản ghi PaymentHistory để lưu thông tin thanh toán
    const paymentHistory = await prisma.paymentHistory.create({
      data: {
        userId: user.id,
        servicePackageId,
        orderCode: orderCode.toString(),
        amount,
        refundAmount,
        description,
        returnUrl,
        cancelUrl
      }
    });

    console.log(`Created PaymentHistory: ${paymentHistory.id} for user: ${user.email}`);

    // Tạo link thanh toán với PayOS
    const body = {
      orderCode,
      amount,
      description,
      returnUrl,
      cancelUrl
    };

    const paymentLinkRes = await payos.createPaymentLink(body);
    
    // Cập nhật PaymentHistory với thông tin từ PayOS
    await prisma.paymentHistory.update({
      where: { id: paymentHistory.id },
      data: {
        checkoutUrl: paymentLinkRes.checkoutUrl,
        qrCode: paymentLinkRes.qrCode
      }
    });
    
    return NextResponse.json({
      error: 0,
      message: "Success",
      data: {
        checkoutUrl: paymentLinkRes.checkoutUrl,
        orderCode: paymentLinkRes.orderCode,
        amount: paymentLinkRes.amount,
        refundAmount,
        description: paymentLinkRes.description,
        qrCode: paymentLinkRes.qrCode
      }
    });
  } catch (error: unknown) {
    let errMsg = '';
    if (typeof error === 'object' && error !== null) {
      const errObj = error as { response?: { data?: string }, message?: string };
      errMsg = errObj.response?.data || errObj.message || JSON.stringify(error);
    } else {
      errMsg = String(error);
    }
    console.error('PayOS error:', errMsg);
    return NextResponse.json({ error: -1, message: "fail", data: errMsg });
  }
}
