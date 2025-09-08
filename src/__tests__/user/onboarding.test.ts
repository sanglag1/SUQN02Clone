// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, PUT } from '@/app/api/user/onboarding/route';
import prisma from '@/lib/prisma';

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ default: { user: { findUnique: vi.fn(), update: vi.fn() } }, prisma: { user: { findUnique: vi.fn(), update: vi.fn() } } }));

const makePostReq = (body: any) => new Request('http://localhost/api/user/onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const makePutReq = (body: any) => new Request('http://localhost/api/user/onboarding', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

describe('/api/user/onboarding', () => {
  beforeEach(() => vi.clearAllMocks());

  it('POST returns 401 when not authenticated', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ userId: null });
    const res = await POST(makePostReq({ step: 'job-role', data: { jobRoleId: 'role1' } }) as any);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('POST validates step and data presence', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ userId: 'ck_1' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', clerkId: 'ck_1' });
    const res = await POST(makePostReq({}) as any);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Step and data are required' });
  });

  it('POST returns 404 when user not found', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ userId: 'ck_1' });
    (prisma as any).user.findUnique.mockResolvedValue(null);
    const res = await POST(makePostReq({ step: 'job-role', data: { jobRoleId: 'role1' } }) as any);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'User not found' });
  });

  it('POST updates job-role step', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ userId: 'ck_1' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', clerkId: 'ck_1' });
    (prisma as any).user.update.mockResolvedValue({ id: 'u1', preferredJobRoleId: 'role1' });
    const res = await POST(makePostReq({ step: 'job-role', data: { jobRoleId: 'role1' } }) as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.step).toBe('job-role');
  });

  it('POST updates experience step', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ userId: 'ck_1' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', clerkId: 'ck_1' });
    (prisma as any).user.update.mockResolvedValue({ id: 'u1', experienceLevel: 'mid' });
    const res = await POST(makePostReq({ step: 'experience', data: { experienceLevel: 'mid' } }) as any);
    expect(res.status).toBe(200);
  });

  it('POST updates skills step', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ userId: 'ck_1' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', clerkId: 'ck_1' });
    (prisma as any).user.update.mockResolvedValue({ id: 'u1', skills: ['react'] });
    const res = await POST(makePostReq({ step: 'skills', data: { skills: ['react'] } }) as any);
    expect(res.status).toBe(200);
  });

  it('POST rejects invalid step', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ userId: 'ck_1' });
    (prisma as any).user.findUnique.mockResolvedValue({ id: 'u1', clerkId: 'ck_1' });
    const res = await POST(makePostReq({ step: 'invalid', data: {} }) as any);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Invalid step' });
  });

  it('PUT requires auth', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ userId: null });
    const res = await PUT(makePutReq({}) as any);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('PUT updates multiple fields and marks onboarding completed', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ userId: 'ck_1' });
    (prisma as any).user.update.mockResolvedValue({ id: 'u1', preferredJobRoleId: 'role1', experienceLevel: 'mid' });
    const res = await PUT(makePutReq({ jobRoleId: 'role1', experienceLevel: 'mid' }) as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.onboardingCompleted).toBe(true);
  });
});


