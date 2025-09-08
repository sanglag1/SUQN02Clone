// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextResponse } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  getAuth: vi.fn()
}));

// Import mocked function reference after vi.mock
const { getAuth } = await import('@clerk/nextjs/server');

describe('withAdminAuth', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (global.fetch as any) = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    (getAuth as any).mockReturnValue({ userId: null } as any);

    const { withAdminAuth } = await import('../../middleware/adminAuth');
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));

    const guarded = await withAdminAuth(handler);
    const res = await guarded({} as any);

    expect(res.status).toBe(401);
  });

  it('returns 404 when user not found', async () => {
    (getAuth as any).mockReturnValue({ userId: 'u1' } as any);
    (global.fetch as any).mockResolvedValue({ ok: false, status: 404 });

    const { withAdminAuth } = await import('../../middleware/adminAuth');
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));

    const guarded = await withAdminAuth(handler);
    const res = await guarded({} as any);

    expect(res.status).toBe(404);
  });

  it('returns 403 when user is not admin', async () => {
    (getAuth as any).mockReturnValue({ userId: 'u1' } as any);
    (global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({ role: 'user' }) });

    const { withAdminAuth } = await import('../../middleware/adminAuth');
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));

    const guarded = await withAdminAuth(handler);
    const res = await guarded({} as any);

    expect(res.status).toBe(403);
  });

  it('calls handler when user is admin (role name string)', async () => {
    (getAuth as any).mockReturnValue({ userId: 'u1' } as any);
    (global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({ role: 'admin' }) });

    const { withAdminAuth } = await import('../../middleware/adminAuth');
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));

    const guarded = await withAdminAuth(handler);
    const res = await guarded({} as any);

    expect(handler).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it('calls handler when user is admin (role object with name)', async () => {
    (getAuth as any).mockReturnValue({ userId: 'u1' } as any);
    (global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({ role: { name: 'admin' } }) });

    const { withAdminAuth } = await import('../../middleware/adminAuth');
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));

    const guarded = await withAdminAuth(handler);
    const res = await guarded({} as any);

    expect(handler).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it('returns 500 on unexpected error', async () => {
    (getAuth as any).mockImplementation(() => { throw new Error('boom'); });

    const { withAdminAuth } = await import('../../middleware/adminAuth');
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));

    const guarded = await withAdminAuth(handler);
    const res = await guarded({} as any);

    expect(res.status).toBe(500);
  });
});
