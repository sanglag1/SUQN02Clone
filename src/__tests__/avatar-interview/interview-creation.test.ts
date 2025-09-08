import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
const mockAuth = vi.fn();
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
  },
  interview: {
    create: vi.fn(),
  },
  userPackage: {
    findMany: vi.fn(),
  },
};

// Mock clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}));

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: mockPrisma,
  prisma: mockPrisma,
}));

// Mock tracking service
vi.mock('@/services/TrackingIntegrationService', () => ({
  TrackingIntegrationService: {
    trackInterviewCompletion: vi.fn(),
  },
}));

// Helper function to create request
const makeReq = (method: string, body?: any) =>
  new NextRequest('http://localhost/api/interviews', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

describe('Interview Creation API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const basePayload = {
    jobRoleId: 'role-123',
    language: 'vi-VN',
    startTime: new Date().toISOString(),
  };

  it('should create interview successfully', async () => {
    const mockUser = { id: 'user-123', clerkId: 'clerk-123' };
    const mockPackage = { 
      id: 'package-123', 
      isActive: true, 
      avatarInterviewUsed: 5,
      servicePackage: { price: 10 }
    };

    mockAuth.mockResolvedValue({ userId: 'clerk-123' });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.userPackage.findMany.mockResolvedValue([mockPackage]);
    mockPrisma.interview.create.mockResolvedValue({
      id: 'interview-123',
      userId: 'user-123',
      jobRoleId: 'role-123',
      status: 'in_progress',
    });

    const { POST } = await import('@/app/api/interviews/route');
    const response = await POST(makeReq('POST', basePayload));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.message).toBe('Interview created successfully');
    expect(data.interviewId).toBe('interview-123');
  });

  it('should return 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const { POST } = await import('@/app/api/interviews/route');
    const response = await POST(makeReq('POST', basePayload));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 when no active package', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk-123' });
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123', clerkId: 'clerk-123' });
    mockPrisma.userPackage.findMany.mockResolvedValue([]);

    const { POST } = await import('@/app/api/interviews/route');
    const response = await POST(makeReq('POST', basePayload));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('No active service package found for user');
  });

  it('should return 403 when usage exceeded', async () => {
    const mockUser = { id: 'user-123', clerkId: 'clerk-123' };
    const mockPackage = { 
      id: 'package-123', 
      isActive: true, 
      avatarInterviewUsed: 0,
      servicePackage: { price: 10 }
    };

    mockAuth.mockResolvedValue({ userId: 'clerk-123' });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.userPackage.findMany.mockResolvedValue([mockPackage]);

    const { POST } = await import('@/app/api/interviews/route');
    const response = await POST(makeReq('POST', basePayload));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Avatar interview usage exceeded');
  });
});
