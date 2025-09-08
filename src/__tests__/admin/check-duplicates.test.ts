// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/questions/check-duplicates/route';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => {
  const p = { question: { findMany: vi.fn() } };
  return { prisma: p, default: p };
});

const makeReq = (body: any) => new Request('http://localhost/api/questions/check-duplicates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

describe('Check Duplicates (POST /api/questions/check-duplicates)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when questions array is missing', async () => {
    const res = await POST(makeReq({}) as any);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: 'Questions array is required' });
  });

  it('detects duplicates with similarity > 0.5', async () => {
    (prisma as any).question.findMany.mockResolvedValue([
      { id: 'q1', question: 'What is React?', fields: [], topics: [] },
      { id: 'q2', question: 'Explain React hooks.', fields: [], topics: [] },
    ]);

    const res = await POST(makeReq({ questions: ['What is React JS?'] }) as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results.length).toBe(1);
    expect(json.results[0].isDuplicate).toBe(true);
    expect(json.results[0].similarQuestions.length).toBeGreaterThan(0);
  });

  it('returns non-duplicate when low similarity', async () => {
    (prisma as any).question.findMany.mockResolvedValue([
      { id: 'q1', question: 'Binary trees and graphs', fields: [], topics: [] },
    ]);

    const res = await POST(makeReq({ questions: ['What is React state?'] }) as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results[0].isDuplicate).toBe(false);
    expect(json.results[0].similarQuestions.length).toBe(0);
  });

  it('returns 500 on unexpected error', async () => {
    (prisma as any).question.findMany.mockRejectedValue(new Error('db down'));

    const res = await POST(makeReq({ questions: ['Any?'] }) as any);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toEqual({ error: 'Failed to check duplicates' });
  });
});
