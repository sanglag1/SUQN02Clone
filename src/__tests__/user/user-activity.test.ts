// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/user/activity/route';
import { prisma } from '@/lib/prisma';

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn(), currentUser: vi.fn() }));

vi.mock('@/lib/prisma', () => {
  const p = {
    user: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
  };
  return { prisma: p, default: p };
});

const makeReq = () => new Request('http://localhost/api/user/activity', { method: 'POST' });

describe('POST /api/user/activity', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ userId: null });

    const res = await POST();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('updates existing user heartbeat and merges Clerk data', async () => {
    const { auth, currentUser } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ userId: 'ck_1' });
    (currentUser as any).mockResolvedValue({ emailAddresses: [{ emailAddress: 'a@b.com' }], firstName: 'A', lastName: 'B', imageUrl: 'img' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@old.com' });
    (prisma as any).user.update.mockResolvedValue({});

    const res = await POST();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect((prisma as any).user.update).toHaveBeenCalled();
  });

  it('creates user when not exists by clerk and email not found', async () => {
    const { auth, currentUser } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ userId: 'ck_2' });
    (currentUser as any).mockResolvedValue({ emailAddresses: [{ emailAddress: 'new@b.com' }], firstName: 'N', lastName: 'U', imageUrl: 'img' });
    (prisma as any).user.findUnique
      .mockResolvedValueOnce(null) // by clerk
      .mockResolvedValueOnce(null); // by email
    // emulate no existing by email inside route's code path (route checks and creates)
    ;(prisma as any).user.create.mockResolvedValue({ id: 'u2' });

    const res = await POST();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect((prisma as any).user.create).toHaveBeenCalled();
  });
});


