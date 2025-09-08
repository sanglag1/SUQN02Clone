// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/questions/route';
import prisma from '@/lib/prisma';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => {
  const create = vi.fn();
  return { default: { question: { create } }, prisma: { question: { create } } };
});

const makeReq = (body: any) =>
  new Request('http://localhost/api/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('Admin Add Questions API (POST /api/questions)', () => {
  const basePayload = {
    question: 'What is 2+2?',
    answers: [
      { content: '3', isCorrect: false },
      { content: '4', isCorrect: true },
    ],
    fields: ['math'],
    topics: ['arithmetic'],
    levels: ['easy'],
    explanation: '2+2=4',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ userId: null });

    const res = await POST(makeReq(basePayload));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toEqual({ error: 'Unauthorized' });
  });

  it('returns 400 when no correct answer is provided', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ userId: 'user_1' });
    (prisma as any).question.create.mockResolvedValue({});

    const payload = {
      ...basePayload,
      answers: [
        { content: '3', isCorrect: false },
        { content: '5', isCorrect: false },
      ],
    };

    const res = await POST(makeReq(payload));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: 'At least one answer must be marked as correct' });
    expect((prisma as any).question.create).not.toHaveBeenCalled();
  });

  it('creates a question successfully (201)', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ userId: 'user_1' });

    const created = { id: 'q_1', ...basePayload };
    (prisma as any).question.create.mockResolvedValue(created);

    const res = await POST(makeReq(basePayload));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toMatchObject(created);

    expect((prisma as any).question.create).toHaveBeenCalledWith({
      data: {
        question: basePayload.question,
        answers: basePayload.answers,
        fields: basePayload.fields,
        topics: basePayload.topics,
        levels: basePayload.levels,
        explanation: basePayload.explanation,
      },
    });
  });

  it('normalizes non-array fields/topics/levels to [] and still creates', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ userId: 'user_1' });

    const created = { id: 'q_2', ...basePayload, fields: [], topics: [], levels: [] };
    (prisma as any).question.create.mockResolvedValue(created);

    const res = await POST(makeReq({ ...basePayload, fields: null, topics: undefined, levels: 'easy' }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toMatchObject(created);

    const call = (prisma as any).question.create.mock.calls[0][0];
    expect(call.data.fields).toEqual([]);
    expect(call.data.topics).toEqual([]);
    expect(call.data.levels).toEqual([]);
  });

  it('returns 500 on unexpected error', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ userId: 'user_1' });
    (prisma as any).question.create.mockRejectedValue(new Error('db down'));

    const res = await POST(makeReq(basePayload));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toEqual({ error: 'Internal server error' });
  });
});


