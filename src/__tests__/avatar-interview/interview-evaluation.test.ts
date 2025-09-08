import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
const mockGetAuth = vi.fn();
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
  },
  interview: {
    findFirst: vi.fn(),
  },
};

// Mock clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  getAuth: mockGetAuth,
}));

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: mockPrisma,
  prisma: mockPrisma,
}));

describe('Interview Evaluation API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return evaluation successfully', async () => {
    const mockUser = { id: 'user-123', clerkId: 'clerk-123' };
    const mockInterview = {
      id: 'interview-123',
      userId: 'user-123',
      startTime: new Date('2024-01-01T10:00:00Z'),
      endTime: new Date('2024-01-01T11:00:00Z'),
      questionCount: 5,
      evaluation: {
        overallRating: 85,
        communicationScore: 80,
        technicalScore: 90,
        problemSolvingScore: 85,
      },
      conversationHistory: [
        { role: 'user', content: 'Hello', timestamp: '2024-01-01T10:00:00Z' },
      ],
      jobRole: { title: 'Frontend Developer', level: 'Junior' }
    };

    mockGetAuth.mockResolvedValue({ userId: 'clerk-123' });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.interview.findFirst.mockResolvedValue(mockInterview);

    const { GET } = await import('@/app/api/interviews/[id]/evaluation/route');
    const request = new NextRequest('http://localhost/api/interviews/interview-123/evaluation');
    const params = Promise.resolve({ id: 'interview-123' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.overallScore).toBe(85);
    expect(data.communicationScore).toBe(80);
    expect(data.technicalScore).toBe(90);
  });

  it('should return 404 when evaluation not available', async () => {
    const mockUser = { id: 'user-123', clerkId: 'clerk-123' };
    const mockInterview = {
      id: 'interview-123',
      userId: 'user-123',
      evaluation: null,
    };

    mockGetAuth.mockResolvedValue({ userId: 'clerk-123' });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.interview.findFirst.mockResolvedValue(mockInterview);

    const { GET } = await import('@/app/api/interviews/[id]/evaluation/route');
    const request = new NextRequest('http://localhost/api/interviews/interview-123/evaluation');
    const params = Promise.resolve({ id: 'interview-123' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Evaluation not available yet');
  });

  it('should return 401 when not authenticated', async () => {
    mockGetAuth.mockResolvedValue({ userId: null });

    const { GET } = await import('@/app/api/interviews/[id]/evaluation/route');
    const request = new NextRequest('http://localhost/api/interviews/interview-123/evaluation');
    const params = Promise.resolve({ id: 'interview-123' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });
});
