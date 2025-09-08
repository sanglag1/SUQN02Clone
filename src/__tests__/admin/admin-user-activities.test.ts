// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/admin/user-activities/route';
import prisma from '@/lib/prisma';

vi.mock('@clerk/nextjs/server', () => ({ currentUser: vi.fn() }));

vi.mock('@/lib/prisma', () => {
  const p = {
    user: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn() },
  };
  return { default: p, prisma: p };
});

const makeReq = (q: Record<string, string>) => {
  const url = new URL('http://localhost/api/admin/user-activities');
  Object.entries(q).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url, { method: 'GET' });
};

describe('Admin User Activities List (GET /api/admin/user-activities)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires auth (401)', async () => {
    const { currentUser } = await import('@clerk/nextjs/server');
    (currentUser as any).mockResolvedValue(null);

    const res = await GET(makeReq({}) as any);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('requires admin (403)', async () => {
    const { currentUser } = await import('@clerk/nextjs/server');
    (currentUser as any).mockResolvedValue({ id: 'ck_1' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', role: { name: 'user' } });

    const res = await GET(makeReq({}) as any);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'Admin access required' });
  });

  it('returns paginated activities with search/sort', async () => {
    const { currentUser } = await import('@clerk/nextjs/server');
    (currentUser as any).mockResolvedValue({ id: 'ck_1' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', role: { name: 'admin' } });
    (prisma as any).user.findMany.mockResolvedValue([
      { id: 'u1', firstName: 'A', lastName: 'B', email: 'a@b.com', createdAt: new Date(), updatedAt: new Date(), lastActivity: new Date(), clerkSessionActive: false, userActivity: { activities: [{ type: 'quiz', score: 80, timestamp: new Date().toISOString() }], skills: [], goals: [], learningStats: { streak: 1, totalStudyTime: 60 } } },
    ]);
    (prisma as any).user.count.mockResolvedValue(1);

    const res = await GET(makeReq({ page: '1', limit: '10', sortBy: 'createdAt', sortOrder: 'desc', search: 'A' }) as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.pagination.total).toBe(1);
    expect(json.activities.length).toBeGreaterThan(0);
    expect(json.summary.totalUsers).toBe(1);
  });

  it('returns 500 on unexpected error', async () => {
    const { currentUser } = await import('@clerk/nextjs/server');
    (currentUser as any).mockResolvedValue({ id: 'ck_1' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', role: { name: 'admin' } });
    (prisma as any).user.findMany.mockRejectedValue(new Error('db down'));

    const res = await GET(makeReq({}) as any);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toEqual({ error: 'Internal server error' });
  });
});
