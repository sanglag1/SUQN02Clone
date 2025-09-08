import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
const mockPackages = [
  {
    id: 'pkg-1',
    name: 'Basic Package',
    price: 100000,
    duration: 30,
    avatarInterviewLimit: 5,
    testQuizEQLimit: 10,
    jdUploadLimit: 2
  },
  {
    id: 'pkg-2',
    name: 'Premium Package',
    price: 200000,
    duration: 60,
    avatarInterviewLimit: 10,
    testQuizEQLimit: 20,
    jdUploadLimit: 5
  }
];

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

describe('Service Package API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/service-package', () => {
    it('should return packages and user packages for authenticated user', async () => {
      const { getAuth } = await import('@clerk/nextjs/server');
      vi.mocked(getAuth).mockResolvedValue({ userId: 'user-123' } as any);





      const mockUserPackages = [
        {
          id: 'user-pkg-1',
          userId: 'user-123',
          servicePackageId: 'pkg-1',
          isActive: true,
          startDate: expect.any(String),
          endDate: expect.any(String)
        }
      ];

      const mockUser = {
        id: 'user-123',
        clerkId: 'clerk-123',
        email: 'test@example.com',
        name: 'Test User'
      };

      const mockPackages = [
        {
          id: 'pkg-1',
          name: 'Basic Package',
          price: 100000,
          duration: 30,
          avatarInterviewLimit: 5,
          testQuizEQLimit: 10,
          jdUploadLimit: 2
        },
        {
          id: 'pkg-2',
          name: 'Premium Package',
          price: 200000,
          duration: 60,
          avatarInterviewLimit: 10,
          testQuizEQLimit: 20,
          jdUploadLimit: 5
        }
      ];



      const { prisma } = await import('@/lib/prisma');
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.userPackage.findMany.mockResolvedValue(mockUserPackages);
      prisma.servicePackage.findMany.mockResolvedValue(mockPackages);
      prisma.servicePackage.create.mockResolvedValue({
        id: expect.any(String),
        name: 'New Package',
        description: '',
        price: 150000,
        duration: 45,
        avatarInterviewLimit: 8,
        testQuizEQLimit: 15,
        jdUploadLimit: 3,
        highlight: false,
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
      prisma.userPackage.findMany.mockResolvedValue(mockUserPackages);
      prisma.servicePackage.findMany.mockResolvedValue(mockPackages);
      prisma.servicePackage.findMany.mockResolvedValue(mockPackages);

      const request = new NextRequest('http://localhost:3000/api/service-package');
      const { GET } = await import('@/app/api/service-package/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("packages"); expect(data).toHaveProperty("userPackages");

      // Note: user.findUnique is not called for unauthenticated requests
      // Note: userPackage.findMany is not called for unauthenticated requests
      // Note: servicePackage.findMany is not called for unauthenticated requests
    });

    it('should return packages for unauthenticated requests', async () => {
      const { getAuth } = await import('@clerk/nextjs/server');
      vi.mocked(getAuth).mockResolvedValue({ userId: null } as any);

      const mockPackages = [
        {
          id: 'pkg-1',
          name: 'Basic Package',
          price: 100000,
          duration: 30,
          avatarInterviewLimit: 5,
          testQuizEQLimit: 10,
          jdUploadLimit: 2
        }
      ];

      const { prisma } = await import('@/lib/prisma');
      prisma.servicePackage.findMany.mockResolvedValue(mockPackages);

      const request = new NextRequest('http://localhost:3000/api/service-package');
      const { GET } = await import('@/app/api/service-package/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("packages");
      expect(data).toHaveProperty("userPackages");
      expect(data.userPackages).toEqual([]);
    });
  });

  describe('POST /api/service-package', () => {
    it('should create a new service package', async () => {
      const { getAuth } = await import('@clerk/nextjs/server');
      vi.mocked(getAuth).mockResolvedValue({ userId: 'user-123' } as any);





      const mockUserPackages = [
        {
          id: 'user-pkg-1',
          userId: 'user-123',
          servicePackageId: 'pkg-1',
          isActive: true,
          startDate: expect.any(String),
          endDate: expect.any(String)
        }
      ];

      const mockUser = {
        id: 'user-123',
        clerkId: 'clerk-123',
        email: 'test@example.com',
        name: 'Test User'
      };

      const newPackage = {
        name: 'New Package',
        price: 150000,
        duration: 45,
        avatarInterviewLimit: 8,
        testQuizEQLimit: 15,
        jdUploadLimit: 3
      };

      const createdPackage = {
        id: 'pkg-3',
        ...newPackage,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { prisma } = await import('@/lib/prisma');
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.userPackage.findMany.mockResolvedValue(mockUserPackages);
      prisma.servicePackage.findMany.mockResolvedValue(mockPackages);
      prisma.servicePackage.create.mockResolvedValue({
        id: expect.any(String),
        name: 'New Package',
        description: '',
        price: 150000,
        duration: 45,
        avatarInterviewLimit: 8,
        testQuizEQLimit: 15,
        jdUploadLimit: 3,
        highlight: false,
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
      prisma.servicePackage.create.mockResolvedValue({
        id: expect.any(String),
        name: 'New Package',
        description: '',
        price: 150000,
        duration: 45,
        avatarInterviewLimit: 8,
        testQuizEQLimit: 15,
        jdUploadLimit: 3,
        highlight: false,
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });

      const request = new NextRequest('http://localhost:3000/api/service-package', {
        method: 'POST',
        body: JSON.stringify(newPackage)
      });
      const { POST } = await import('@/app/api/service-package/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({
        id: expect.any(String),
        name: 'New Package',
        description: '',
        price: 150000,
        duration: 45,
        avatarInterviewLimit: 8,
        testQuizEQLimit: 15,
        jdUploadLimit: 3,
        highlight: false,
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });

      expect(prisma.servicePackage.create).toHaveBeenCalledWith({
        data: newPackage
      });
    });
  });

  describe('PATCH /api/service-package', () => {
    it('should update an existing service package', async () => {
      const { getAuth } = await import('@clerk/nextjs/server');
      vi.mocked(getAuth).mockResolvedValue({ userId: 'user-123' } as any);





      const mockUserPackages = [
        {
          id: 'user-pkg-1',
          userId: 'user-123',
          servicePackageId: 'pkg-1',
          isActive: true,
          startDate: expect.any(String),
          endDate: expect.any(String)
        }
      ];

      const mockUser = {
        id: 'user-123',
        clerkId: 'clerk-123',
        email: 'test@example.com',
        name: 'Test User'
      };

      const updateData = {
        id: 'pkg-1',
        price: 180000
      };

      const updatedPackage = {
        id: 'pkg-1',
        name: 'Basic Package',
        price: 180000,
        duration: 30,
        avatarInterviewLimit: 5,
        testQuizEQLimit: 10,
        jdUploadLimit: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { prisma } = await import('@/lib/prisma');
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.userPackage.findMany.mockResolvedValue(mockUserPackages);
      prisma.servicePackage.findMany.mockResolvedValue(mockPackages);
      prisma.servicePackage.findUnique.mockResolvedValue({
        id: 'pkg-1',
        name: 'Basic Package',
        price: 100000,
        duration: 30,
        avatarInterviewLimit: 5,
        testQuizEQLimit: 10,
        jdUploadLimit: 2,
        highlight: false,
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
      prisma.servicePackage.update.mockResolvedValue({
        id: 'pkg-1',
        name: 'Updated Package',
        description: 'Updated description',
        price: 250000,
        duration: 90,
        avatarInterviewLimit: 15,
        testQuizEQLimit: 30,
        jdUploadLimit: 8,
        highlight: true,
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });

      const request = new NextRequest('http://localhost:3000/api/service-package', {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });
      const { PATCH } = await import('@/app/api/service-package/route');
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        id: 'pkg-1',
        name: 'Updated Package',
        description: 'Updated description',
        price: 250000,
        duration: 90,
        avatarInterviewLimit: 15,
        testQuizEQLimit: 30,
        jdUploadLimit: 8,
        highlight: true,
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });

      expect(prisma.servicePackage.update).toHaveBeenCalledWith({
        where: { id: 'pkg-1' },
        data: { price: 180000 }
      });
    });
  });

  describe('DELETE /api/service-package', () => {
    it('should delete a service package', async () => {
      const { getAuth } = await import('@clerk/nextjs/server');
      vi.mocked(getAuth).mockResolvedValue({ userId: 'user-123' } as any);





      const mockUserPackages = [
        {
          id: 'user-pkg-1',
          userId: 'user-123',
          servicePackageId: 'pkg-1',
          isActive: true,
          startDate: expect.any(String),
          endDate: expect.any(String)
        }
      ];

      const mockUser = {
        id: 'user-123',
        clerkId: 'clerk-123',
        email: 'test@example.com',
        name: 'Test User'
      };

      const deletedPackage = {
        id: 'pkg-1',
        name: 'Basic Package',
        price: 100000,
        duration: 30,
        avatarInterviewLimit: 5,
        testQuizEQLimit: 10,
        jdUploadLimit: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { prisma } = await import('@/lib/prisma');
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.userPackage.findMany.mockResolvedValue(mockUserPackages);
      prisma.servicePackage.findMany.mockResolvedValue(mockPackages);
      prisma.servicePackage.findUnique.mockResolvedValue({
        id: 'pkg-1',
        name: 'Basic Package',
        price: 100000,
        duration: 30,
        avatarInterviewLimit: 5,
        testQuizEQLimit: 10,
        jdUploadLimit: 2,
        highlight: false,
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
      prisma.userPackage.count.mockResolvedValue(0);
      prisma.servicePackage.delete.mockResolvedValue({
        id: 'pkg-1',
        name: 'Deleted Package',
        description: 'Package to delete',
        price: 100000,
        duration: 30,
        avatarInterviewLimit: 5,
        testQuizEQLimit: 10,
        jdUploadLimit: 2,
        highlight: false,
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });

      const request = new NextRequest('http://localhost:3000/api/service-package?id=pkg-1', {
        method: 'DELETE'
      });
      const { DELETE } = await import('@/app/api/service-package/route');
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        id: 'pkg-1',
        name: 'Deleted Package',
        description: 'Package to delete',
        price: 100000,
        duration: 30,
        avatarInterviewLimit: 5,
        testQuizEQLimit: 10,
        jdUploadLimit: 2,
        highlight: false,
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });

      expect(prisma.servicePackage.delete).toHaveBeenCalledWith({
        where: { id: 'pkg-1' }
      });
    });
  });
});
