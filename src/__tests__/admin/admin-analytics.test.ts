// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/admin/user-activities/analytics/route';
import { prisma } from '@/lib/prisma';

vi.mock('@clerk/nextjs/server', () => ({ currentUser: vi.fn() }));

vi.mock('@/lib/prisma', () => {
  const p = {
    user: { findUnique: vi.fn(), count: vi.fn() },
    userActivity: { findMany: vi.fn() },
  };
  return { prisma: p, default: p };
});

const makeReq = (timeframe?: string) => {
  const url = new URL('http://localhost/api/admin/user-activities/analytics');
  if (timeframe) url.searchParams.set('timeframe', timeframe);
  return new Request(url, { method: 'GET' });
};

describe('Admin Analytics (GET /api/admin/user-activities/analytics)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires auth (401)', async () => {
    const { currentUser } = await import('@clerk/nextjs/server');
    (currentUser as any).mockResolvedValue(null);

    const res = await GET(makeReq() as any);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('requires admin (403)', async () => {
    const { currentUser } = await import('@clerk/nextjs/server');
    (currentUser as any).mockResolvedValue({ id: 'ck_1' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', role: { name: 'user' } });

    const res = await GET(makeReq() as any);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'Admin access required' });
  });

  it('returns analytics payload when admin', async () => {
    const { currentUser } = await import('@clerk/nextjs/server');
    (currentUser as any).mockResolvedValue({ id: 'ck_1' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', role: { name: 'admin' } });
    (prisma as any).userActivity.findMany.mockResolvedValue([
      { userId: 'u1', activities: [{ type: 'quiz', score: 80, timestamp: new Date().toISOString() }], skills: [], goals: [], learningStats: { streak: 3, totalStudyTime: 120 }, user: { firstName: 'A', lastName: 'B', email: 'a@b.com' } },
    ]);
    (prisma as any).user.count.mockResolvedValue(10);

    const res = await GET(makeReq('7') as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.overview.totalUsers).toBe(10);
    expect(json.activityStats.totalQuizzes).toBeGreaterThanOrEqual(1);
    expect(json.timeframe.days).toBe(7);
  });

  it('returns 500 on unexpected error', async () => {
    const { currentUser } = await import('@clerk/nextjs/server');
    (currentUser as any).mockResolvedValue({ id: 'ck_1' });
    (prisma as any).user.findUnique.mockRejectedValue(new Error('db down'));

    const res = await GET(makeReq() as any);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Internal server error');
  });
});
