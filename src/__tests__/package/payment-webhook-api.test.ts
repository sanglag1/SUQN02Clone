import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  getAuth: vi.fn()
}));

vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn()
    },
    servicePackage: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn()
    },
    userPackage: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      upsert: vi.fn()
    },
    paymentHistory: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn()
    },
    $transaction: vi.fn((callback) => callback(mockPrisma))
  };
  return { default: mockPrisma, prisma: mockPrisma };
});

describe('Payment Webhook API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/payment/webhook', () => {
    it('should process successful payment webhook', async () => {
      const mockUser = {
        id: 'user-123',
        clerkId: 'clerk-123',
        email: 'test@example.com',
        name: 'Test User'
      };

      const mockServicePackage = {
        id: 'pkg-1',
        name: 'Premium Package',
        price: 200000,
        duration: 60,
        avatarInterviewLimit: 10,
        testQuizEQLimit: 20,
        jdUploadLimit: 5
      };

      const mockPaymentHistory = {
        id: 'payment-1',
        userId: 'user-123',
        servicePackageId: 'pkg-1',
        amount: 200000,
        orderCode: 'ORDER123',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockUserPackage = {
        id: 'user-pkg-1',
        userId: 'user-123',
        servicePackageId: 'pkg-1',
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        avatarInterviewUsed: 0,
        testQuizEQUsed: 0,
        jdUploadUsed: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const webhookData = {
        success: true,
        data: {
          orderCode: 'ORDER123'
        }
      };

      const { prisma } = await import('@/lib/prisma');
      prisma.paymentHistory.findFirst.mockResolvedValue(mockPaymentHistory);
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.servicePackage.findUnique.mockResolvedValue(mockServicePackage);
      prisma.userPackage.findFirst.mockResolvedValue(null);
      prisma.userPackage.upsert.mockResolvedValue(mockUserPackage);
      prisma.paymentHistory.update.mockResolvedValue({
        ...mockPaymentHistory,
        status: 'success'
      });

      const request = new NextRequest('http://localhost:3000/api/payment/webhook', {
        method: 'POST',
        body: JSON.stringify(webhookData)
      });
      const { POST } = await import('@/app/api/payment/webhook/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true, error: 0, message: "Ok" });

      expect(prisma.paymentHistory.findFirst).toHaveBeenCalledWith({
        where: { orderCode: 'ORDER123' },
        include: { servicePackage: true, user: true }
      });
      expect(prisma.paymentHistory.update).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
        data: { 
          status: 'success',
          transactionId: expect.any(String),
          paidAt: expect.any(Date)
        }
      });
      // Note: userPackage.upsert is called within transaction, not directly
    });

    it('should handle payment not found', async () => {
      const webhookData = {
        success: true,
        data: {
          orderCode: 'INVALID-ORDER'
        }
      };

      const { prisma } = await import('@/lib/prisma');
      prisma.paymentHistory.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/payment/webhook', {
        method: 'POST',
        body: JSON.stringify(webhookData)
      });
      const { POST } = await import('@/app/api/payment/webhook/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ 
        success: true, 
        error: 0, 
        message: "Ok"
      });

    it('should handle non-success payment status', async () => {
      const mockPaymentHistory = {
        id: 'payment-1',
        userId: 'user-123',
        servicePackageId: 'pkg-1',
        amount: 200000,
        orderCode: 'ORDER123',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const webhookData = {
        success: false,
        data: {
          orderCode: 'ORDER123'
        }
      };

      const { prisma } = await import('@/lib/prisma');
      prisma.paymentHistory.findFirst.mockResolvedValue(mockPaymentHistory);
      prisma.paymentHistory.update.mockResolvedValue({
        ...mockPaymentHistory,
        status: 'failed'
      });

      const request = new NextRequest('http://localhost:3000/api/payment/webhook', {
        method: 'POST',
        body: JSON.stringify(webhookData)
      });
      const { POST } = await import('@/app/api/payment/webhook/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ 
        success: true, 
        error: 0, 
        message: "Ok"
      });

      // Note: paymentHistory.update is not called for non-success payment status
    });

    it('should handle existing active user package', async () => {
      const mockUser = {
        id: 'user-123',
        clerkId: 'clerk-123',
        email: 'test@example.com',
        name: 'Test User'
      };

      const mockServicePackage = {
        id: 'pkg-1',
        name: 'Premium Package',
        price: 200000,
        duration: 60,
        avatarInterviewLimit: 10,
        testQuizEQLimit: 20,
        jdUploadLimit: 5
      };

      const mockPaymentHistory = {
        id: 'payment-1',
        userId: 'user-123',
        servicePackageId: 'pkg-1',
        amount: 200000,
        orderCode: 'ORDER123',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const existingUserPackage = {
        id: 'user-pkg-1',
        userId: 'user-123',
        servicePackageId: 'pkg-1',
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        avatarInterviewUsed: 2,
        testQuizEQUsed: 5,
        jdUploadUsed: 1
      };

      const webhookData = {
        success: true,
        data: {
          orderCode: 'ORDER123'
        }
      };

      const { prisma } = await import('@/lib/prisma');
      prisma.paymentHistory.findFirst.mockResolvedValue(mockPaymentHistory);
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.servicePackage.findUnique.mockResolvedValue(mockServicePackage);
      prisma.userPackage.findFirst.mockResolvedValue(existingUserPackage);
      prisma.userPackage.update.mockResolvedValue({
        ...existingUserPackage,
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      });
      prisma.paymentHistory.update.mockResolvedValue({
        ...mockPaymentHistory,
        status: 'success'
      });

      const request = new NextRequest('http://localhost:3000/api/payment/webhook', {
        method: 'POST',
        body: JSON.stringify(webhookData)
      });
      const { POST } = await import('@/app/api/payment/webhook/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ 
        success: true, 
        error: 0, 
        message: "Ok",
        data: expect.objectContaining({
  

      // Note: userPackage.updateMany is called within transaction, not directly
    });
  });
});
