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

describe('Payment History API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/payment/history', () => {
    it('should return payment history for authenticated user', async () => {
      const { getAuth } = await import('@clerk/nextjs/server');
      vi.mocked(getAuth).mockResolvedValue({ userId: 'user-123' } as any);

      const mockUser = {
        id: 'user-123',
        clerkId: 'clerk-123',
        email: 'test@example.com',
        name: 'Test User'
      };

      const mockPaymentHistory = [
        {
          id: 'payment-1',
          userId: 'user-123',
          servicePackageId: 'pkg-1',
          amount: 200000,
          orderCode: 'ORDER123',
          status: 'success',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          servicePackage: {
            id: 'pkg-1',
            name: 'Premium Package',
            price: 200000,
            duration: 60
          }
        },
        {
          id: 'payment-2',
          userId: 'user-123',
          servicePackageId: 'pkg-2',
          amount: 100000,
          orderCode: 'ORDER456',
          status: 'pending',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          servicePackage: {
            id: 'pkg-2',
            name: 'Basic Package',
            price: 100000,
            duration: 30
          }
        }
      ];

      const { prisma } = await import('@/lib/prisma');
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.paymentHistory.findMany.mockResolvedValue(mockPaymentHistory);

      const request = new NextRequest('http://localhost:3000/api/payment/history');
      const { GET } = await import('@/app/api/payment/history/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: mockPaymentHistory,
        total: mockPaymentHistory.length
      });

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { clerkId: 'clerk-123' }
      });
      expect(prisma.paymentHistory.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        include: { servicePackage: true },
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      const { getAuth } = await import('@clerk/nextjs/server');
      vi.mocked(getAuth).mockResolvedValue({ userId: null } as any);

      const request = new NextRequest('http://localhost:3000/api/payment/history');
      const { GET } = await import('@/app/api/payment/history/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('POST /api/payment/history', () => {
    it('should create a new payment history record', async () => {
      const { getAuth } = await import('@clerk/nextjs/server');
      vi.mocked(getAuth).mockResolvedValue({ userId: 'user-123' } as any);

      const mockUser = {
        id: 'user-123',
        clerkId: 'clerk-123',
        email: 'test@example.com',
        name: 'Test User'
      };

      const newPaymentHistory = {
        userId: 'user-123',
        servicePackageId: 'pkg-1',
        amount: 200000,
        orderCode: 'ORDER123',
        status: 'pending'
      };

      const createdPaymentHistory = {
        id: 'payment-1',
        ...newPaymentHistory,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      };

      const { prisma } = await import('@/lib/prisma');
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.paymentHistory.updateMany.mockResolvedValue({ count: 1 });

      const request = new NextRequest('http://localhost:3000/api/payment/history', {
        method: 'POST',
        body: JSON.stringify(newPaymentHistory)
      });
      const { POST } = await import('@/app/api/payment/history/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: 'Payment status updated successfully'
      });

      expect(prisma.paymentHistory.updateMany).toHaveBeenCalledWith({
        where: {
          orderCode: 'ORDER123',
          userId: 'user-123'
        },
        data: {
          status: 'pending',
          updatedAt: expect.any(String)
        }
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      const { getAuth } = await import('@clerk/nextjs/server');
      vi.mocked(getAuth).mockResolvedValue({ userId: null } as any);

      const request = new NextRequest('http://localhost:3000/api/payment/history', {
        method: 'POST',
        body: JSON.stringify({})
      });
      const { POST } = await import('@/app/api/payment/history/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });
  });
});
