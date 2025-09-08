// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/admin/user-activities/[userId]/route';
import { prisma } from '@/lib/prisma';

vi.mock('@clerk/nextjs/server', () => ({ currentUser: vi.fn() }));

vi.mock('@/lib/prisma', () => {
  const p = {
    user: { findUnique: vi.fn() },
    userActivity: { findUnique: vi.fn() },
  };
  return { prisma: p, default: p };
});

const makeReq = (userId: string, q?: Record<string, string>) => {
  const url = new URL(`http://localhost/api/admin/user-activities/${userId}`);
  if (q) Object.entries(q).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url, { method: 'GET' });
};

const paramsArg = (userId: string) => ({ params: Promise.resolve({ userId }) }) as any;

describe('Admin User Activity Detail (GET /api/admin/user-activities/[userId])', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires auth (401)', async () => {
    const { currentUser } = await import('@clerk/nextjs/server');
    (currentUser as any).mockResolvedValue(null);

    const res = await GET(makeReq('u1') as any, paramsArg('u1'));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('requires admin (403)', async () => {
    const { currentUser } = await import('@clerk/nextjs/server');
    (currentUser as any).mockResolvedValue({ id: 'ck_admin' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'uadmin', role: { name: 'user' } });

    const res = await GET(makeReq('u1') as any, paramsArg('u1'));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'Admin access required' });
  });

  it('returns 404 when user activity not found', async () => {
    const { currentUser } = await import('@clerk/nextjs/server');
    (currentUser as any).mockResolvedValue({ id: 'ck_admin' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'uadmin', role: { name: 'admin' } });
    (prisma as any).userActivity.findUnique.mockResolvedValue(null);

    const res = await GET(makeReq('u1') as any, paramsArg('u1'));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'User activity not found' });
  });

  it('returns detail with filters (timeRange, activityType)', async () => {
    const { currentUser } = await import('@clerk/nextjs/server');
    (currentUser as any).mockResolvedValue({ id: 'ck_admin' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'uadmin', role: { name: 'admin' } });

    (prisma as any).userActivity.findUnique.mockResolvedValue({
      userId: 'u1',
      activities: [
        { id: 'a1', type: 'quiz', score: 80, duration: 20, timestamp: new Date().toISOString() },
        { id: 'a2', type: 'interview', score: 70, duration: 30, timestamp: new Date().toISOString() },
      ],
      skills: [ { name: 'React', score: 75, level: 'intermediate' } ],
      goals: [ { status: 'completed' }, { status: 'in_progress' } ],
      learningStats: { streak: 3, longestStreak: 5, totalStudyTime: 100 },
      user: { id: 'u1', firstName: 'A', lastName: 'B', email: 'a@b.com', role: { name: 'user' }, createdAt: new Date(), clerkId: 'ck_1' },
    });

    const res = await GET(makeReq('u1', { timeRange: '7', activityType: 'quiz' }) as any, paramsArg('u1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user.id).toBe('u1');
    expect(json.stats.totalActivities).toBeGreaterThanOrEqual(1);
    expect(json.activities.length).toBeGreaterThanOrEqual(1);
    expect(json.timeframe.days).toBe(7);
    expect(json.timeframe.activityType).toBe('quiz');
  });

  it('returns 500 on unexpected error', async () => {
    const { currentUser } = await import('@clerk/nextjs/server');
    (currentUser as any).mockResolvedValue({ id: 'ck_admin' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'uadmin', role: { name: 'admin' } });
    (prisma as any).userActivity.findUnique.mockRejectedValue(new Error('db down'));

    const res = await GET(makeReq('u1') as any, paramsArg('u1'));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Internal server error');
  });
});
