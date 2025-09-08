import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET, OPTIONS } from '@/app/api/assessment/route';

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));

vi.mock('@/lib/prisma', () => {
  const prisma = {
    user: { findUnique: vi.fn() },
    userPackage: { findFirst: vi.fn(), update: vi.fn() },
    jobRole: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
    assessment: { create: vi.fn(), findMany: vi.fn() },
  } as any;
  return { default: prisma };
});

vi.mock('@/services/trackingIntegrationService', () => ({
  TrackingIntegrationService: { trackAssessmentCompletion: vi.fn() },
}));

describe('Assessment API', () => {
  const userId = 'clerk-user-1';
  const dbUserId = 'db-user-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('OPTIONS should return 200', async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(200);
  });

  describe('POST /api/assessment', () => {
    it('returns 401 if unauthenticated', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: null });
      const req = new NextRequest('http://localhost/api/assessment', { method: 'POST', body: JSON.stringify({}) });
      const res = await POST(req);
      const data = await res.json();
      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('validates type must be "test"', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId });
      const req = new NextRequest('http://localhost/api/assessment', { method: 'POST', body: JSON.stringify({ type: 'eq' }) });
      const res = await POST(req);
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toContain('Invalid type');
    });

    it('returns 404 if db user not found', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId });
      const prisma = (await import('@/lib/prisma')).default as any;
      prisma.user.findUnique.mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/assessment', { method: 'POST', body: JSON.stringify({ type: 'test' }) });
      const res = await POST(req);
      const data = await res.json();
      expect(res.status).toBe(404);
      expect(data.error).toContain('User not found');
    });

    it('returns 403 if no active package', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId });
      const prisma = (await import('@/lib/prisma')).default as any;
      prisma.user.findUnique.mockResolvedValue({ id: dbUserId });
      prisma.userPackage.findFirst.mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/assessment', { method: 'POST', body: JSON.stringify({ type: 'test' }) });
      const res = await POST(req);
      const data = await res.json();
      expect(res.status).toBe(403);
      expect(data.error).toContain('No active service package');
    });

    it('returns 403 if usage exceeded', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId });
      const prisma = (await import('@/lib/prisma')).default as any;
      prisma.user.findUnique.mockResolvedValue({ id: dbUserId });
      prisma.userPackage.findFirst.mockResolvedValue({ id: 'pkg1', testQuizEQUsed: 0, servicePackage: { testQuizEQLimit: 5 } });

      const req = new NextRequest('http://localhost/api/assessment', { method: 'POST', body: JSON.stringify({ type: 'test' }) });
      const res = await POST(req);
      const data = await res.json();
      expect(res.status).toBe(403);
      expect(data.error).toContain('usage exceeded');
    });

    it('creates assessment with jobRoleId and decrements usage', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId });
      const prisma = (await import('@/lib/prisma')).default as any;
      prisma.user.findUnique.mockResolvedValue({ id: dbUserId });
      prisma.userPackage.findFirst.mockResolvedValue({ id: 'pkg1', testQuizEQUsed: 3, servicePackage: { testQuizEQLimit: 5 } });
      prisma.jobRole.findUnique.mockResolvedValue({ id: 'role1' });
      prisma.assessment.create.mockResolvedValue({ id: 'asm1', type: 'test', userId, jobRoleId: 'role1' });

      const body = { type: 'test', jobRoleId: 'role1' };
      const req = new NextRequest('http://localhost/api/assessment', { method: 'POST', body: JSON.stringify(body) });
      const res = await POST(req);
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.id).toBe('asm1');
      expect(prisma.userPackage.update).toHaveBeenCalledWith({ where: { id: 'pkg1' }, data: { testQuizEQUsed: 2 } });
    });

    it('creates jobRole when position given and not exists; adds topic to realTimeScores', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId });
      const prisma = (await import('@/lib/prisma')).default as any;
      prisma.user.findUnique.mockResolvedValue({ id: dbUserId });
      prisma.userPackage.findFirst.mockResolvedValue({ id: 'pkg1', testQuizEQUsed: 1, servicePackage: { testQuizEQLimit: 5 } });
      prisma.jobRole.findFirst.mockResolvedValue(null);
      prisma.jobRole.create.mockResolvedValue({ id: 'newrole' });
      prisma.assessment.create.mockImplementation(async (args: any) => ({ id: 'asm2', ...args.data }));

      const body = { type: 'test', position: 'Frontend Developer', topic: 'React' };
      const req = new NextRequest('http://localhost/api/assessment', { method: 'POST', body: JSON.stringify(body) });
      const res = await POST(req);
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.jobRoleId).toBe('newrole');
      // ensure topic was added to realTimeScores
      expect(prisma.assessment.create).toHaveBeenCalled();
      const call = prisma.assessment.create.mock.calls[0][0];
      expect(call.data.realTimeScores).toEqual({ topic: 'React' });
    });

    it('handles server errors', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId });
      const prisma = (await import('@/lib/prisma')).default as any;
      prisma.user.findUnique.mockResolvedValue({ id: dbUserId });
      prisma.userPackage.findFirst.mockResolvedValue({ id: 'pkg1', testQuizEQUsed: 1, servicePackage: { testQuizEQLimit: 5 } });
      prisma.assessment.create.mockRejectedValue(new Error('db fail'));

      const req = new NextRequest('http://localhost/api/assessment', { method: 'POST', body: JSON.stringify({ type: 'test' }) });
      const res = await POST(req);
      const data = await res.json();
      expect(res.status).toBe(500);
      expect(data.error).toBe('Lưu kết quả thất bại');
    });
  });

  describe('GET /api/assessment', () => {
    it('requires auth', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: null });
      const req = new NextRequest('http://localhost/api/assessment');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns assessments with optional type and limit', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId });
      const prisma = (await import('@/lib/prisma')).default as any;
      prisma.assessment.findMany.mockResolvedValue([{ id: 'a1' }, { id: 'a2' }]);
      const req = new NextRequest('http://localhost/api/assessment?type=test&limit=2');
      const res = await GET(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(prisma.assessment.findMany).toHaveBeenCalled();
    });

    it('handles fetch errors', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId });
      const prisma = (await import('@/lib/prisma')).default as any;
      prisma.assessment.findMany.mockRejectedValue(new Error('db'));
      const req = new NextRequest('http://localhost/api/assessment');
      const res = await GET(req);
      const data = await res.json();
      expect(res.status).toBe(500);
      expect(data.error).toBe('Lấy kết quả thất bại');
    });
  });
});


