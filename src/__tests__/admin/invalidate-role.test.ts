// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/user/invalidate-role/route';
import prisma from '@/lib/prisma';

vi.mock('@clerk/nextjs/server', () => ({ currentUser: vi.fn() }));

vi.mock('@/lib/prisma', () => {
  const p = { user: { findUnique: vi.fn() } };
  return { default: p, prisma: p };
});

const makeReq = (body: any) => new Request('http://localhost/api/user/invalidate-role', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

describe('Invalidate Role (POST /api/user/invalidate-role)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    const { currentUser } = await import('@clerk/nextjs/server');
    (currentUser as any).mockResolvedValue(null);

    const res = await POST(makeReq({ clerkId: 'ck_2' }) as any);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns 403 when current user is not admin', async () => {
    const { currentUser } = await import('@clerk/nextjs/server');
    (currentUser as any).mockResolvedValue({ id: 'ck_1' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', role: { name: 'user' } });

    const res = await POST(makeReq({ clerkId: 'ck_2' }) as any);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('Access Denied');
  });

  it('returns 400 when missing clerkId', async () => {
    const { currentUser } = await import('@clerk/nextjs/server');
    (currentUser as any).mockResolvedValue({ id: 'ck_1' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', role: { name: 'admin' } });

    const res = await POST(makeReq({}) as any);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Clerk ID is required' });
  });

  it('returns success payload when admin and clerkId provided', async () => {
    const { currentUser } = await import('@clerk/nextjs/server');
    (currentUser as any).mockResolvedValue({ id: 'ck_1' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', role: { name: 'admin' } });

    const res = await POST(makeReq({ clerkId: 'ck_target' }) as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.clerkId).toBe('ck_target');
    expect(json.message).toMatch(/Role invalidation signal sent/i);
  });

  it('returns 500 when database error occurs during admin check', async () => {
    const { currentUser } = await import('@clerk/nextjs/server');
    (currentUser as any).mockResolvedValue({ id: 'ck_1' });
    (prisma as any).user.findUnique.mockRejectedValue(new Error('db down'));

    const res = await POST(makeReq({ clerkId: 'ck_target' }) as any);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toEqual({ error: 'Database error' });
  });
});
