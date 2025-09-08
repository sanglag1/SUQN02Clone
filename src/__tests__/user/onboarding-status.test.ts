// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/user/onboarding-status/route';
import prisma from '@/lib/prisma';

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ default: { user: { findUnique: vi.fn() } }, prisma: { user: { findUnique: vi.fn() } } }));

const makeReq = () => new Request('http://localhost/api/user/onboarding-status', { method: 'GET' });

describe('GET /api/user/onboarding-status', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ userId: null });
    const res = await GET(makeReq() as any);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns 404 when user not found', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ userId: 'ck_1' });
    (prisma as any).user.findUnique.mockResolvedValue(null);
    const res = await GET(makeReq() as any);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'User not found' });
  });

  it('returns needsOnboarding true when required fields missing', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ userId: 'ck_1' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', clerkId: 'ck_1', createdAt: new Date(), preferredJobRoleId: null, experienceLevel: null });
    const res = await GET(makeReq() as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.needsOnboarding).toBe(true);
    expect(json.onboardingCompleted).toBe(false);
  });

  it('returns needsOnboarding false when profile complete', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ userId: 'ck_1' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', clerkId: 'ck_1', createdAt: new Date(Date.now() - 48*60*60*1000), preferredJobRoleId: 'role1', experienceLevel: 'mid' });
    const res = await GET(makeReq() as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.needsOnboarding).toBe(false);
    expect(json.onboardingCompleted).toBe(true);
  });
});


