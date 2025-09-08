// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PUT } from '@/app/api/questions/[id]/route';
import prisma from '@/lib/prisma';

vi.mock('@clerk/nextjs/server', () => ({
  getAuth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => {
  const userFindUnique = vi.fn();
  const qFindUnique = vi.fn();
  const qUpdate = vi.fn();
  return {
    default: {
      user: { findUnique: userFindUnique },
      question: { findUnique: qFindUnique, update: qUpdate },
    },
    prisma: {
      user: { findUnique: userFindUnique },
      question: { findUnique: qFindUnique, update: qUpdate },
    },
  };
});

const makeReq = (body: any) =>
  new Request('http://localhost/api/questions/q1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const paramsArg = { params: Promise.resolve({ id: 'q1' }) } as any;

describe('Admin Edit Questions API (PUT /api/questions/[id])', () => {
  const basePayload = {
    question: 'Updated question?',
    answers: [
      { content: 'A', isCorrect: true },
      { content: 'B', isCorrect: false },
    ],
    fields: ['backend'],
    topics: ['nodejs'],
    levels: ['medium'],
    explanation: 'Because...',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    const { getAuth } = await import('@clerk/nextjs/server');
    (getAuth as any).mockReturnValue({ userId: null });

    const res = await PUT(makeReq(basePayload) as any, paramsArg);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns 404 when user not found', async () => {
    const { getAuth } = await import('@clerk/nextjs/server');
    (getAuth as any).mockReturnValue({ userId: 'user_1' });
    (prisma as any).user.findUnique.mockResolvedValue(null);

    const res = await PUT(makeReq(basePayload) as any, paramsArg);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'User not found' });
  });

  it('returns 403 when user is not admin', async () => {
    const { getAuth } = await import('@clerk/nextjs/server');
    (getAuth as any).mockReturnValue({ userId: 'user_1' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', role: { name: 'user' } });

    const res = await PUT(makeReq(basePayload) as any, paramsArg);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'Only admin can update questions' });
  });

  it('returns 400 when no correct answer', async () => {
    const { getAuth } = await import('@clerk/nextjs/server');
    (getAuth as any).mockReturnValue({ userId: 'user_1' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', role: { name: 'admin' } });

    const payload = {
      ...basePayload,
      answers: [
        { content: 'A', isCorrect: false },
        { content: 'B', isCorrect: false },
      ],
    };
    const res = await PUT(makeReq(payload) as any, paramsArg);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'At least one answer must be marked as correct' });
  });

  it('returns 400 when fields/topics/levels are missing', async () => {
    const { getAuth } = await import('@clerk/nextjs/server');
    (getAuth as any).mockReturnValue({ userId: 'user_1' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', role: { name: 'admin' } });

    // fields empty
    let res = await PUT(makeReq({ ...basePayload, fields: [] }) as any, paramsArg);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'At least one field must be selected' });

    // topics empty
    res = await PUT(makeReq({ ...basePayload, topics: [] }) as any, paramsArg);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'At least one topic must be selected' });

    // levels empty
    res = await PUT(makeReq({ ...basePayload, levels: [] }) as any, paramsArg);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'At least one level must be selected' });
  });

  it('returns 404 when question not found', async () => {
    const { getAuth } = await import('@clerk/nextjs/server');
    (getAuth as any).mockReturnValue({ userId: 'user_1' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', role: { name: 'admin' } });
    (prisma as any).question.findUnique.mockResolvedValue(null);

    const res = await PUT(makeReq(basePayload) as any, paramsArg);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Question not found' });
  });

  it('updates question successfully', async () => {
    const { getAuth } = await import('@clerk/nextjs/server');
    (getAuth as any).mockReturnValue({ userId: 'user_1' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', role: { name: 'admin' } });
    (prisma as any).question.findUnique.mockResolvedValue({ id: 'q1' });
    const updated = { id: 'q1', ...basePayload };
    (prisma as any).question.update.mockResolvedValue(updated);

    const res = await PUT(makeReq(basePayload) as any, paramsArg);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject(updated);

    const call = (prisma as any).question.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: 'q1' });
    expect(call.data).toMatchObject({
      question: basePayload.question,
      answers: basePayload.answers,
      fields: basePayload.fields,
      topics: basePayload.topics,
      levels: basePayload.levels,
      explanation: basePayload.explanation,
    });
    expect(call.data.updatedAt).toBeInstanceOf(Date);
  });

  it('returns 500 on unexpected error', async () => {
    const { getAuth } = await import('@clerk/nextjs/server');
    (getAuth as any).mockReturnValue({ userId: 'user_1' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', role: { name: 'admin' } });
    (prisma as any).question.findUnique.mockResolvedValue({ id: 'q1' });
    (prisma as any).question.update.mockRejectedValue(new Error('db down'));

    const res = await PUT(makeReq(basePayload) as any, paramsArg);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Internal server error' });
  });
});


