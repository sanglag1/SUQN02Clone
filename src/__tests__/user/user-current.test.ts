// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/user/current/route';
import prisma from '@/lib/prisma';

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ default: { user: { findUnique: vi.fn() } }, prisma: { user: { findUnique: vi.fn() } } }));

const makeReq = () => new Request('http://localhost/api/user/current', { method: 'GET' });

describe('GET /api/user/current', () => {
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

  it('returns current user when authenticated', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ userId: 'ck_1' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', clerkId: 'ck_1', email: 'a@b.com' });

    const res = await GET(makeReq() as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.clerkId).toBe('ck_1');
    expect(json.email).toBe('a@b.com');
  });

  it('returns 500 on unexpected error', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ userId: 'ck_1' });
    (prisma as any).user.findUnique.mockRejectedValue(new Error('db down'));

    const res = await GET(makeReq() as any);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toEqual({ error: 'Internal server error' });
  });
});
