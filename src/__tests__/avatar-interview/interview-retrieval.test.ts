import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
const mockAuth = vi.fn();
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
  },
  interview: {
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

// Helper function to create request
const makeReq = (method: string, url?: string) =>
  new NextRequest(url || 'http://localhost/api/interviews', {
    method,
    headers: { 'Content-Type': 'application/json' },
  });

describe('Interview Retrieval API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return user interviews successfully', async () => {
    const mockUser = { id: 'user-123', clerkId: 'clerk-123' };
    const mockInterviews = [
      { id: 'interview-1', userId: 'user-123', status: 'completed' },
      { id: 'interview-2', userId: 'user-123', status: 'in_progress' }
    ];

    mockAuth.mockResolvedValue({ userId: 'clerk-123' });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.interview.findMany.mockResolvedValue(mockInterviews);

    const { GET } = await import('@/app/api/interviews/route');
    const response = await GET(makeReq('GET'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.interviews).toEqual(mockInterviews);
    expect(data.stats.totalInterviews).toBe(2);
  });

  it('should filter by status', async () => {
    const mockUser = { id: 'user-123', clerkId: 'clerk-123' };
    mockAuth.mockResolvedValue({ userId: 'clerk-123' });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.interview.findMany.mockResolvedValue([]);

    const { GET } = await import('@/app/api/interviews/route');
    const request = new NextRequest('http://localhost/api/interviews?status=completed');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.interview.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'completed'
        })
      })
    );
  });

  it('should return 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const { GET } = await import('@/app/api/interviews/route');
    const response = await GET(makeReq('GET'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });
});
