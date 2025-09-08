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

describe('User Package API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/user-package', () => {
    it('should return user packages for authenticated user', async () => {
      const { getAuth } = await import('@clerk/nextjs/server');
      vi.mocked(getAuth).mockResolvedValue({ userId: 'user-123' } as any);

      const mockUser = {
        id: 'user-123',
        clerkId: 'clerk-123',
        email: 'test@example.com',
        name: 'Test User'
      };

      const mockUserPackages = [
        {
          id: 'user-pkg-1',
          userId: 'user-123',
          servicePackageId: 'pkg-1',
          isActive: true,
          startDate: expect.any(String),
          endDate: expect.any(String),
          avatarInterviewUsed: 2,
          testQuizEQUsed: 5,
          jdUploadUsed: 1,
          servicePackage: {
            id: 'pkg-1',
            name: 'Basic Package',
            price: 100000,
            duration: 30,
            avatarInterviewLimit: 5,
            testQuizEQLimit: 10,
            jdUploadLimit: 2
          }
        }
      ];

      const { prisma } = await import('@/lib/prisma');
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.userPackage.findMany.mockResolvedValue(mockUserPackages);

      const request = new NextRequest('http://localhost:3000/api/user-package');
      const { GET } = await import('@/app/api/user-package/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockUserPackages);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { clerkId: 'clerk-123' }
      });
      expect(prisma.userPackage.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        include: { servicePackage: true }
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      const { getAuth } = await import('@clerk/nextjs/server');
      vi.mocked(getAuth).mockResolvedValue({ userId: null } as any);

      const request = new NextRequest('http://localhost:3000/api/user-package');
      const { GET } = await import('@/app/api/user-package/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('POST /api/user-package', () => {
    it('should create a new user package', async () => {
      const { getAuth } = await import('@clerk/nextjs/server');
      vi.mocked(getAuth).mockResolvedValue({ userId: 'user-123' } as any);

      const mockUser = {
        id: 'user-123',
        clerkId: 'clerk-123',
        email: 'test@example.com',
        name: 'Test User'
      };

      const mockServicePackage = {
        id: 'pkg-1',
        name: 'Basic Package',
        price: 100000,
        duration: 30,
        avatarInterviewLimit: 5,
        testQuizEQLimit: 10,
        jdUploadLimit: 2
      };

      const newUserPackage = {
        servicePackageId: 'pkg-1',
        startDate: expect.any(String),
        endDate: expect.any(String)
      };

      const createdUserPackage = {
        id: 'user-pkg-1',
        userId: 'user-123',
        ...newUserPackage,
        isActive: true,
        avatarInterviewUsed: 0,
        testQuizEQUsed: 0,
        jdUploadUsed: 0,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      };

      const { prisma } = await import('@/lib/prisma');
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.servicePackage.findUnique.mockResolvedValue(mockServicePackage);
      prisma.userPackage.create.mockResolvedValue({
        id: expect.any(String),
        userId: 'user-123',
        servicePackageId: 'pkg-1',
        startDate: expect.any(String),
        endDate: expect.any(String),
        avatarInterviewUsed: 0,
        testQuizEQUsed: 0,
        jdUploadUsed: 0,
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        servicePackage: {
          id: 'pkg-1',
          name: 'Basic Package',
          price: 100000,
          duration: 30,
          avatarInterviewLimit: 5,
          testQuizEQLimit: 10,
          jdUploadLimit: 2
        }
      });

      const request = new NextRequest('http://localhost:3000/api/user-package', {
        method: 'POST',
        body: JSON.stringify(newUserPackage)
      });
      const { POST } = await import('@/app/api/user-package/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({
        id: expect.any(String),
        userId: 'user-123',
        servicePackageId: 'pkg-1',
        startDate: expect.any(String),
        endDate: expect.any(String),
        avatarInterviewUsed: 0,
        testQuizEQUsed: 0,
        jdUploadUsed: 0,
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        servicePackage: {
          id: 'pkg-1',
          name: 'Basic Package',
          price: 100000,
          duration: 30,
          avatarInterviewLimit: 5,
          testQuizEQLimit: 10,
          jdUploadLimit: 2
        }
      });

      expect(prisma.servicePackage.findUnique).toHaveBeenCalledWith({
        where: { id: 'pkg-1' }
      });
      expect(prisma.userPackage.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          servicePackageId: 'pkg-1',
          startDate: expect.any(String),
          endDate: expect.any(String),
          isActive: true,
          avatarInterviewUsed: 0,
          testQuizEQUsed: 0,
          jdUploadUsed: 0
        }
      });
    });
  });

  describe('PATCH /api/user-package', () => {
    it('should update an existing user package', async () => {
      const { getAuth } = await import('@clerk/nextjs/server');
      vi.mocked(getAuth).mockResolvedValue({ userId: 'user-123' } as any);

      const mockUser = {
        id: 'user-123',
        clerkId: 'clerk-123',
        email: 'test@example.com',
        name: 'Test User'
      };

      const updateData = {
        id: 'user-pkg-1',
        avatarInterviewUsed: 3
      };

      const updatedUserPackage = {
        id: 'user-pkg-1',
        userId: 'user-123',
        servicePackageId: 'pkg-1',
        isActive: true,
        startDate: expect.any(String),
        endDate: expect.any(String),
        avatarInterviewUsed: 3,
        testQuizEQUsed: 5,
        jdUploadUsed: 1,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      };

      const { prisma } = await import('@/lib/prisma');
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.userPackage.findUnique.mockResolvedValue({
        id: 'user-pkg-1',
        userId: 'user-123',
        servicePackageId: 'pkg-1',
        startDate: expect.any(String),
        endDate: expect.any(String),
        avatarInterviewUsed: 0,
        testQuizEQUsed: 0,
        jdUploadUsed: 0,
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        servicePackage: {
          id: 'pkg-1',
          name: 'Basic Package',
          price: 100000,
          duration: 30,
          avatarInterviewLimit: 5,
          testQuizEQLimit: 10,
          jdUploadLimit: 2
        }
      });
      prisma.userPackage.update.mockResolvedValue({
        id: 'user-pkg-1',
        userId: 'user-123',
        servicePackageId: 'pkg-1',
        startDate: expect.any(String),
        endDate: expect.any(String),
        avatarInterviewUsed: 3,
        testQuizEQUsed: 7,
        jdUploadUsed: 1,
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        servicePackage: {
          id: 'pkg-1',
          name: 'Basic Package',
          price: 100000,
          duration: 30,
          avatarInterviewLimit: 5,
          testQuizEQLimit: 10,
          jdUploadLimit: 2
        }
      });

      const request = new NextRequest('http://localhost:3000/api/user-package', {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });
      const { PATCH } = await import('@/app/api/user-package/route');
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({
        id: 'user-pkg-1',
        userId: 'user-123',
        servicePackageId: 'pkg-1',
        startDate: expect.any(String),
        endDate: expect.any(String),
        avatarInterviewUsed: 3,
        testQuizEQUsed: 7,
        jdUploadUsed: 1,
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        servicePackage: {
          id: 'pkg-1',
          name: 'Basic Package',
          price: 100000,
          duration: 30,
          avatarInterviewLimit: 5,
          testQuizEQLimit: 10,
          jdUploadLimit: 2
        },
        usage: {
          avatarInterview: "2/5",
          testQuizEQ: "3/10",
          jdUpload: "1/2"
        }
      });

      expect(prisma.userPackage.update).toHaveBeenCalledWith({
        where: { id: 'user-pkg-1' },
        data: { avatarInterviewUsed: 3 }
      });
    });
  });

  describe('DELETE /api/user-package', () => {
    it('should delete a user package', async () => {
      const { getAuth } = await import('@clerk/nextjs/server');
      vi.mocked(getAuth).mockResolvedValue({ userId: 'user-123' } as any);

      const mockUser = {
        id: 'user-123',
        clerkId: 'clerk-123',
        email: 'test@example.com',
        name: 'Test User'
      };

      const deletedUserPackage = {
        id: 'user-pkg-1',
        userId: 'user-123',
        servicePackageId: 'pkg-1',
        isActive: true,
        startDate: expect.any(String),
        endDate: expect.any(String),
        avatarInterviewUsed: 2,
        testQuizEQUsed: 5,
        jdUploadUsed: 1,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      };

      const { prisma } = await import('@/lib/prisma');
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.userPackage.findUnique.mockResolvedValue({
        id: 'user-pkg-1',
        userId: 'user-123',
        servicePackageId: 'pkg-1',
        startDate: expect.any(String),
        endDate: expect.any(String),
        avatarInterviewUsed: 2,
        testQuizEQUsed: 5,
        jdUploadUsed: 1,
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        servicePackage: {
          id: 'pkg-1',
          name: 'Basic Package',
          price: 100000,
          duration: 30,
          avatarInterviewLimit: 5,
          testQuizEQLimit: 10,
          jdUploadLimit: 2
        }
      });
      prisma.userPackage.delete.mockResolvedValue({
        id: 'user-pkg-1',
        userId: 'user-123',
        servicePackageId: 'pkg-1',
        startDate: expect.any(String),
        endDate: expect.any(String),
        avatarInterviewUsed: 2,
        testQuizEQUsed: 5,
        jdUploadUsed: 1,
        isActive: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        servicePackage: {
          id: 'pkg-1',
          name: 'Basic Package',
          price: 100000,
          duration: 30,
          avatarInterviewLimit: 5,
          testQuizEQLimit: 10,
          jdUploadLimit: 2
        }
      });

      const request = new NextRequest('http://localhost:3000/api/user-package?id=user-pkg-1', {
        method: 'DELETE'
      });
      const { DELETE } = await import('@/app/api/user-package/route');
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({
        message: 'User package deleted successfully',
        deletedPackage: {
          id: 'user-pkg-1',
          userId: 'user-123',
          servicePackageId: 'pkg-1',
          startDate: expect.any(String),
          endDate: expect.any(String),
          avatarInterviewUsed: 2,
          testQuizEQUsed: 5,
          jdUploadUsed: 1,
          isActive: false,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          servicePackage: {
            id: 'pkg-1',
            name: 'Basic Package',
            price: 100000,
            duration: 30,
            avatarInterviewLimit: 5,
            testQuizEQLimit: 10,
            jdUploadLimit: 2
          }
        }
      });

      expect(prisma.userPackage.delete).toHaveBeenCalledWith({
        where: { id: 'user-pkg-1' }
      });
    });
  });
});
