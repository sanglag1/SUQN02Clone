import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH, PUT, GET, DELETE, OPTIONS } from '@/app/api/assessment/[id]/route';

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));

vi.mock('@/lib/prisma', () => {
  const prisma = {
    user: { findUnique: vi.fn() },
    assessment: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
  } as any;
  return { default: prisma };
});

vi.mock('@/services/trackingIntegrationService', () => ({
  TrackingIntegrationService: { trackAssessmentCompletion: vi.fn() },
}));

describe('Assessment [id] API', () => {
  const userId = 'clerk-user-1';
  const assessmentId = 'assessment-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('OPTIONS should return 200', async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(200);
  });

  describe('PATCH /api/assessment/[id]', () => {
    it('returns 401 if unauthenticated', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: null });
      const req = new NextRequest('http://localhost/api/assessment/1', { method: 'PATCH', body: JSON.stringify({}) });
      const res = await PATCH(req, { params: Promise.resolve({ id: assessmentId }) });
      const data = await res.json();
      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 404 if assessment not found', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId });
      const prisma = (await import('@/lib/prisma')).default as any;
      prisma.assessment.findFirst.mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/assessment/1', { method: 'PATCH', body: JSON.stringify({}) });
      const res = await PATCH(req, { params: Promise.resolve({ id: assessmentId }) });
      const data = await res.json();
      expect(res.status).toBe(404);
      expect(data.error).toBe('Assessment not found');
    });

    it('updates assessment with question/answer and evaluation', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId });
      const prisma = (await import('@/lib/prisma')).default as any;
      prisma.assessment.findFirst.mockResolvedValue({ id: assessmentId, userId, history: '[]' });
      prisma.assessment.update.mockResolvedValue({ id: assessmentId, history: '[{"question":"test","answer":"test","evaluation":{}}]' });

      const body = {
        question: 'What is React?',
        answer: 'A JavaScript library',
        evaluation: { scores: { fundamental: 8, logic: 7, language: 9 } },
        topic: 'Frontend',
        questionNumber: 1
      };
      const req = new NextRequest('http://localhost/api/assessment/1', { method: 'PATCH', body: JSON.stringify(body) });
      const res = await PATCH(req, { params: Promise.resolve({ id: assessmentId }) });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.historyCount).toBe(1);
    });

    it('calculates final scores when status is completed', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId });
      const prisma = (await import('@/lib/prisma')).default as any;
      const history = JSON.stringify([
        { question: 'Q1', answer: 'A1', evaluation: { scores: { fundamental: 8, logic: 7, language: 9 } } },
        { question: 'Q2', answer: 'A2', evaluation: { scores: { fundamental: 9, logic: 8, language: 7 } } }
      ]);
      prisma.assessment.findFirst.mockResolvedValue({ id: assessmentId, userId, history });
      prisma.assessment.update.mockResolvedValue({ id: assessmentId, finalScores: { overall: 8.17 } });

      const body = { status: 'completed' };
      const req = new NextRequest('http://localhost/api/assessment/1', { method: 'PATCH', body: JSON.stringify(body) });
      const res = await PATCH(req, { params: Promise.resolve({ id: assessmentId }) });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('tracks completion when status is completed with final scores', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId });
      const prisma = (await import('@/lib/prisma')).default as any;
      prisma.user.findUnique.mockResolvedValue({ id: 'db-user-1' });
      prisma.assessment.findFirst.mockResolvedValue({ id: assessmentId, userId, history: '[]' });
      prisma.assessment.update.mockResolvedValue({ id: assessmentId, finalScores: { overall: 8 } });

      const { TrackingIntegrationService } = await import('@/services/trackingIntegrationService');
      (TrackingIntegrationService.trackAssessmentCompletion as any).mockResolvedValue(undefined);

      const body = { status: 'completed', finalScores: { overall: 8 } };
      const req = new NextRequest('http://localhost/api/assessment/1', { method: 'PATCH', body: JSON.stringify(body) });
      const res = await PATCH(req, { params: Promise.resolve({ id: assessmentId }) });
      expect(res.status).toBe(200);
      expect(TrackingIntegrationService.trackAssessmentCompletion).toHaveBeenCalled();
    });
  });

  describe('PUT /api/assessment/[id]', () => {
    it('returns 401 if unauthenticated', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: null });
      const req = new NextRequest('http://localhost/api/assessment/1', { method: 'PUT', body: JSON.stringify({}) });
      const res = await PUT(req, { params: Promise.resolve({ id: assessmentId }) });
      const data = await res.json();
      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 400 if assessment ID is missing', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId });
      const req = new NextRequest('http://localhost/api/assessment/', { method: 'PUT', body: JSON.stringify({}) });
      const res = await PUT(req, { params: Promise.resolve({ id: '' }) });
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toBe('Assessment ID is required');
    });

    it('returns 404 if assessment not found', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId });
      const prisma = (await import('@/lib/prisma')).default as any;
      prisma.assessment.findUnique.mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/assessment/1', { method: 'PUT', body: JSON.stringify({}) });
      const res = await PUT(req, { params: Promise.resolve({ id: assessmentId }) });
      const data = await res.json();
      expect(res.status).toBe(404);
      expect(data.error).toBe('Assessment not found');
    });

    it('returns 403 if user does not own assessment', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId });
      const prisma = (await import('@/lib/prisma')).default as any;
      prisma.assessment.findUnique.mockResolvedValue({ id: assessmentId, userId: 'other-user' });

      const req = new NextRequest('http://localhost/api/assessment/1', { method: 'PUT', body: JSON.stringify({}) });
      const res = await PUT(req, { params: Promise.resolve({ id: assessmentId }) });
      const data = await res.json();
      expect(res.status).toBe(403);
      expect(data.error).toBe('Permission denied');
    });

    it('updates assessment successfully', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId });
      const prisma = (await import('@/lib/prisma')).default as any;
      prisma.assessment.findUnique.mockResolvedValue({ id: assessmentId, userId });
      prisma.assessment.update.mockResolvedValue({ id: assessmentId, userId, finalScores: { overall: 8 } });

      const { TrackingIntegrationService } = await import('@/services/trackingIntegrationService');
      (TrackingIntegrationService.trackAssessmentCompletion as any).mockResolvedValue(undefined);

      const body = { finalScores: { overall: 8 } };
      const req = new NextRequest('http://localhost/api/assessment/1', { method: 'PUT', body: JSON.stringify(body) });
      const res = await PUT(req, { params: Promise.resolve({ id: assessmentId }) });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.finalScores.overall).toBe(8);
      expect(TrackingIntegrationService.trackAssessmentCompletion).toHaveBeenCalled();
    });
  });

  describe('GET /api/assessment/[id]', () => {
    it('returns 401 if unauthenticated', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: null });
      const req = new NextRequest('http://localhost/api/assessment/1');
      const res = await GET(req, { params: Promise.resolve({ id: assessmentId }) });
      const data = await res.json();
      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 400 if assessment ID is missing', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId });
      const req = new NextRequest('http://localhost/api/assessment/');
      const res = await GET(req, { params: Promise.resolve({ id: '' }) });
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toBe('Assessment ID is required');
    });

    it('returns 404 if assessment not found', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId });
      const prisma = (await import('@/lib/prisma')).default as any;
      prisma.assessment.findUnique.mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/assessment/1');
      const res = await GET(req, { params: Promise.resolve({ id: assessmentId }) });
      const data = await res.json();
      expect(res.status).toBe(404);
      expect(data.error).toBe('Assessment not found');
    });

    it('returns 403 if user does not own assessment and is not admin', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId });
      const prisma = (await import('@/lib/prisma')).default as any;
      prisma.assessment.findUnique.mockResolvedValue({ id: assessmentId, userId: 'other-user' });
      prisma.user.findUnique.mockResolvedValue({ clerkId: userId, role: { name: 'user' } });

      const req = new NextRequest('http://localhost/api/assessment/1');
      const res = await GET(req, { params: Promise.resolve({ id: assessmentId }) });
      const data = await res.json();
      expect(res.status).toBe(403);
      expect(data.error).toBe('Permission denied');
    });

    it('allows admin to access any assessment', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId });
      const prisma = (await import('@/lib/prisma')).default as any;
      prisma.assessment.findUnique.mockResolvedValue({ id: assessmentId, userId: 'other-user' });
      prisma.user.findUnique.mockResolvedValue({ clerkId: userId, role: { name: 'admin' } });

      const req = new NextRequest('http://localhost/api/assessment/1');
      const res = await GET(req, { params: Promise.resolve({ id: assessmentId }) });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.id).toBe(assessmentId);
    });

    it('returns assessment successfully for owner', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId });
      const prisma = (await import('@/lib/prisma')).default as any;
      const mockAssessment = { id: assessmentId, userId, type: 'test', finalScores: { overall: 8 } };
      prisma.assessment.findUnique.mockResolvedValue(mockAssessment);

      const req = new NextRequest('http://localhost/api/assessment/1');
      const res = await GET(req, { params: Promise.resolve({ id: assessmentId }) });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toEqual(mockAssessment);
    });
  });

  describe('DELETE /api/assessment/[id]', () => {
    it('returns 401 if unauthenticated', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: null });
      const req = new NextRequest('http://localhost/api/assessment/1', { method: 'DELETE' });
      const res = await DELETE(req, { params: Promise.resolve({ id: assessmentId }) });
      const data = await res.json();
      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 400 if assessment ID is missing', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId });
      const req = new NextRequest('http://localhost/api/assessment/', { method: 'DELETE' });
      const res = await DELETE(req, { params: Promise.resolve({ id: '' }) });
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toBe('Assessment ID is required');
    });

    it('returns 404 if assessment not found', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId });
      const prisma = (await import('@/lib/prisma')).default as any;
      prisma.assessment.findUnique.mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/assessment/1', { method: 'DELETE' });
      const res = await DELETE(req, { params: Promise.resolve({ id: assessmentId }) });
      const data = await res.json();
      expect(res.status).toBe(404);
      expect(data.error).toBe('Assessment not found');
    });

    it('returns 403 if user does not own assessment and is not admin', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId });
      const prisma = (await import('@/lib/prisma')).default as any;
      prisma.assessment.findUnique.mockResolvedValue({ id: assessmentId, userId: 'other-user' });
      prisma.user.findUnique.mockResolvedValue({ clerkId: userId, role: { name: 'user' } });

      const req = new NextRequest('http://localhost/api/assessment/1', { method: 'DELETE' });
      const res = await DELETE(req, { params: Promise.resolve({ id: assessmentId }) });
      const data = await res.json();
      expect(res.status).toBe(403);
      expect(data.error).toBe('Permission denied');
    });

    it('allows admin to delete any assessment', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId });
      const prisma = (await import('@/lib/prisma')).default as any;
      prisma.assessment.findUnique.mockResolvedValue({ id: assessmentId, userId: 'other-user' });
      prisma.user.findUnique.mockResolvedValue({ clerkId: userId, role: { name: 'admin' } });
      prisma.assessment.delete.mockResolvedValue({ id: assessmentId });

      const req = new NextRequest('http://localhost/api/assessment/1', { method: 'DELETE' });
      const res = await DELETE(req, { params: Promise.resolve({ id: assessmentId }) });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('deletes assessment successfully for owner', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId });
      const prisma = (await import('@/lib/prisma')).default as any;
      prisma.assessment.findUnique.mockResolvedValue({ id: assessmentId, userId });
      prisma.assessment.delete.mockResolvedValue({ id: assessmentId });

      const req = new NextRequest('http://localhost/api/assessment/1', { method: 'DELETE' });
      const res = await DELETE(req, { params: Promise.resolve({ id: assessmentId }) });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});

