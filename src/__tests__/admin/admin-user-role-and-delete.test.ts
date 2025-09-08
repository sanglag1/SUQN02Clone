// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as SET_ADMIN } from '@/app/api/admin/set-admin/route';
import { PATCH as UPDATE_USER, DELETE as DELETE_USER } from '@/app/api/user/[id]/route';
import prisma from '@/lib/prisma';

vi.mock('@/lib/prisma', () => {
  const user = { findUnique: vi.fn(), update: vi.fn() };
  const role = { findUnique: vi.fn() };
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

const makeSetAdminReq = (body: any) => new Request('http://localhost/api/admin/set-admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const makePatchReq = (id: string, body: any) => new Request(`http://localhost/api/user/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const makeDeleteReq = (id: string) => new Request(`http://localhost/api/user/${id}`, { method: 'DELETE' });

describe('Admin role changes & user deletion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('promotes to admin via POST /api/admin/set-admin', async () => {
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B', roleId: 'role_user', role: { name: 'user' } });
    (prisma as any).user.update.mockResolvedValue({ id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B', roleId: 'admin_role_id', role: { name: 'admin' } });

    const res = await SET_ADMIN(makeSetAdminReq({ email: 'a@b.com' }) as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toMatch(/granted admin/i);
    expect(json.user.role).toBe('admin');
  });

  it('demotes to user via PATCH /api/user/[id] with role', async () => {
    (prisma as any).user.findUnique
      .mockResolvedValueOnce({ id: 'u1', clerkId: 'ck_1', role: { name: 'admin' } }) // load existing
      .mockResolvedValueOnce({ id: 'role_user_id', name: 'user' }); // role lookup
    (prisma as any).role = { findFirst: vi.fn().mockResolvedValue({ id: 'role_user_id', name: 'user' }) } as any;
    (prisma as any).user.update = vi.fn().mockResolvedValue({ id: 'u1', clerkId: 'ck_1', role: { id: 'role_user_id', name: 'user' } });

    const res = await UPDATE_USER(makePatchReq('ck_1', { role: 'user' }) as any, { params: Promise.resolve({ id: 'ck_1' }) } as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user.role?.id).toBe('role_user_id');
    expect(json.user.role?.name).toBe('user');
  });

  it('deletes user via DELETE /api/user/[id]', async () => {
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', clerkId: 'ck_1', email: 'a@b.com', firstName: 'A', lastName: 'B' });

    const res = await DELETE_USER(makeDeleteReq('ck_1') as any, { params: Promise.resolve({ id: 'ck_1' }) } as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toMatch(/deleted successfully/i);
  });
});
