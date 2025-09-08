// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH, DELETE } from '@/app/api/user/[id]/route';
import prisma from '@/lib/prisma';

vi.mock('@/lib/prisma', () => {
  const user = { findUnique: vi.fn(), update: vi.fn() };
  const role = { findFirst: vi.fn() };
  const tx = {
    userActivity: { deleteMany: vi.fn() },
    quiz: { deleteMany: vi.fn() },
    jdQuestions: { deleteMany: vi.fn() },
    userPackage: { deleteMany: vi.fn() },
    paymentHistory: { deleteMany: vi.fn() },
    interview: { deleteMany: vi.fn() },
    user: { delete: vi.fn() },
  };
  const $transaction = vi.fn((fn) => fn(tx));
  return { default: { user, role, $transaction }, prisma: { user, role, $transaction } };
});

vi.mock('@clerk/nextjs/server', () => ({ clerkClient: vi.fn(async () => ({ users: { deleteUser: vi.fn() } })) }));

const makeReq = (id: string, init?: RequestInit) => new Request(`http://localhost/api/user/${id}`, init);
const paramsArg = (id: string) => ({ params: Promise.resolve({ id }) }) as any;

describe('User profile CRUD /api/user/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('GET returns 400 when missing id', async () => {
    const res = await GET(makeReq('') as any, { params: Promise.resolve({ id: '' }) } as any);
    expect(res.status).toBe(400);
  });

  it('GET returns 404 when not found', async () => {
    (prisma as any).user.findUnique.mockResolvedValue(null);
    const res = await GET(makeReq('ck_1') as any, paramsArg('ck_1'));
    expect(res.status).toBe(404);
  });

  it('GET returns profile', async () => {
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', clerkId: 'ck_1', email: 'a@b.com', role: { name: 'user' }, firstName: 'A', lastName: 'B', createdAt: new Date() });
    const res = await GET(makeReq('ck_1') as any, paramsArg('ck_1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.clerkId).toBe('ck_1');
  });

  it('PATCH updates name and role by name', async () => {
    (prisma as any).user.findUnique
      .mockResolvedValueOnce({ id: 'u1', clerkId: 'ck_1', role: { name: 'user' } }) // load existing
      .mockResolvedValueOnce({ id: 'u1', clerkId: 'ck_1', role: { name: 'admin' }, firstName: 'X', lastName: 'Y', email: 'a@b.com' }); // response include
    (prisma as any).role.findFirst.mockResolvedValue({ id: 'role_admin', name: 'admin' });
    (prisma as any).user.update.mockResolvedValue({ id: 'u1', clerkId: 'ck_1', role: { id: 'role_admin', name: 'admin' }, firstName: 'X', lastName: 'Y', email: 'a@b.com', status: 'active', avatar: 'img' });

    const body = { firstName: 'X', lastName: 'Y', role: 'admin' };
    const res = await PATCH(makeReq('ck_1', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) as any, paramsArg('ck_1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user.role.name).toBe('admin');
  });

  it('DELETE removes user and related data', async () => {
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', clerkId: 'ck_1', email: 'a@b.com', firstName: 'A', lastName: 'B' });

    const res = await DELETE(makeReq('ck_1', { method: 'DELETE' }) as any, paramsArg('ck_1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toMatch(/User deleted successfully/i);
  });
});


