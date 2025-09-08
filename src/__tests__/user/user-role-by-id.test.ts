// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/user/[id]/role/route';
import prisma from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({ default: { user: { findUnique: vi.fn() } }, prisma: { user: { findUnique: vi.fn() } } }));

const makeReq = (id: string) => new Request(`http://localhost/api/user/${id}/role`, { method: 'GET' });
const paramsArg = (id: string) => ({ params: Promise.resolve({ id }) }) as any;

describe('GET /api/user/[id]/role', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when missing id', async () => {
    const res = await GET(makeReq('') as any, paramsArg(''));
    expect(res.status).toBe(400);
  });

  it('returns 404 when user not found', async () => {
    (prisma as any).user.findUnique.mockResolvedValue(null);
    const res = await GET(makeReq('ck_1') as any, paramsArg('ck_1'));
    expect(res.status).toBe(404);
  });

  it('returns role name/display', async () => {
    (prisma as any).user.findUnique.mockResolvedValue({ clerkId: 'ck_1', role: { name: 'admin', displayName: 'Administrator' } });
    const res = await GET(makeReq('ck_1') as any, paramsArg('ck_1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.clerkId).toBe('ck_1');
    expect(json.role).toBe('admin');
  });
});


