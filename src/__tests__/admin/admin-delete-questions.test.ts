// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DELETE } from '@/app/api/questions/[id]/route';
import prisma from '@/lib/prisma';

vi.mock('@clerk/nextjs/server', () => ({ getAuth: vi.fn() }));

vi.mock('@/lib/prisma', () => {
  const userFindUnique = vi.fn();
  const qFindUnique = vi.fn();
  const qDelete = vi.fn();
  return {
    default: {
      user: { findUnique: userFindUnique },
      question: { findUnique: qFindUnique, delete: qDelete },
    },
    prisma: {
      user: { findUnique: userFindUnique },
      question: { findUnique: qFindUnique, delete: qDelete },
    },
  };
});

const paramsArg = { params: Promise.resolve({ id: 'q1' }) } as any;
const makeReq = () => new Request('http://localhost/api/questions/q1', { method: 'DELETE' });

describe('Delete Question API (DELETE /api/questions/[id])', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    const { getAuth } = await import('@clerk/nextjs/server');
    (getAuth as any).mockReturnValue({ userId: null });

    const res = await DELETE(makeReq() as any, paramsArg);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns 404 when user not found', async () => {
    const { getAuth } = await import('@clerk/nextjs/server');
    (getAuth as any).mockReturnValue({ userId: 'user_1' });
    (prisma as any).user.findUnique.mockResolvedValue(null);

    const res = await DELETE(makeReq() as any, paramsArg);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'User not found' });
  });

  it('returns 403 when user is not admin', async () => {
    const { getAuth } = await import('@clerk/nextjs/server');
    (getAuth as any).mockReturnValue({ userId: 'user_1' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', role: { name: 'user' } });

    const res = await DELETE(makeReq() as any, paramsArg);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'Only admin can delete questions' });
  });

  it('returns 404 when question not found', async () => {
    const { getAuth } = await import('@clerk/nextjs/server');
    (getAuth as any).mockReturnValue({ userId: 'user_1' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', role: { name: 'admin' } });
    (prisma as any).question.findUnique.mockResolvedValue(null);

    const res = await DELETE(makeReq() as any, paramsArg);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Question not found' });
  });

  it('deletes question successfully', async () => {
    const { getAuth } = await import('@clerk/nextjs/server');
    (getAuth as any).mockReturnValue({ userId: 'user_1' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', role: { name: 'admin' } });
    (prisma as any).question.findUnique.mockResolvedValue({ id: 'q1' });
    (prisma as any).question.delete.mockResolvedValue({});

    const res = await DELETE(makeReq() as any, paramsArg);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: 'Question deleted successfully' });
  });

  it('returns 500 on unexpected error', async () => {
    const { getAuth } = await import('@clerk/nextjs/server');
    (getAuth as any).mockReturnValue({ userId: 'user_1' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', role: { name: 'admin' } });
    (prisma as any).question.findUnique.mockResolvedValue({ id: 'q1' });
    (prisma as any).question.delete.mockRejectedValue(new Error('db down'));

    const res = await DELETE(makeReq() as any, paramsArg);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Internal server error' });
  });
});
