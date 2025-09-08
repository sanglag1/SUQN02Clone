// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/questions/route';
import prisma from '@/lib/prisma';

vi.mock('@/lib/prisma', () => {
  const count = vi.fn();
  const findMany = vi.fn();
  return { default: { question: { count, findMany } }, prisma: { question: { count, findMany } } };
});

const makeUrl = (q: Record<string, string | number | undefined>) => {
  const usp = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v !== undefined) usp.set(k, String(v));
  });
  return `http://localhost/api/questions?${usp.toString()}`;
};

describe('View Question Bank API (GET /api/questions)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns paginated results with default paging', async () => {
    (prisma as any).question.count.mockResolvedValue(42);
    (prisma as any).question.findMany.mockResolvedValue([{ id: 'q1' }]);

    const req = new Request(makeUrl({}), { method: 'GET' });
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual([{ id: 'q1' }]);
    expect(json.pagination.total).toBe(42);
    expect(json.pagination.page).toBe(1);
    expect(json.pagination.limit).toBe(20);
  });

  it('applies filters (field/topic/level/search) and pagination', async () => {
    (prisma as any).question.count.mockResolvedValue(5);
    (prisma as any).question.findMany.mockResolvedValue([{ id: 'q2' }]);

    const req = new Request(makeUrl({ page: 2, limit: 10, field: 'fe', topic: 'react', level: 'easy', search: 'hooks' }), { method: 'GET' });
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual([{ id: 'q2' }]);
    expect(json.pagination.page).toBe(2);
    expect(json.pagination.limit).toBe(10);
    expect(json.pagination.total).toBe(5);
  });

  it('returns 500 on unexpected error', async () => {
    (prisma as any).question.count.mockRejectedValue(new Error('db down'));
    const req = new Request(makeUrl({}), { method: 'GET' });
    const res = await GET(req as any);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toEqual({ error: 'Internal server error' });
  });
});
