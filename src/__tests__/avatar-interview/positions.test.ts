import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
const mockPrisma = {
  jobRole: {
    findMany: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({
  default: mockPrisma,
  prisma: mockPrisma,
}));

// Helper function to create request
const makeReq = (method: string) =>
  new NextRequest('http://localhost/api/positions', {
    method,
    headers: { 'Content-Type': 'application/json' },
  });

describe('Positions API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return job positions successfully', async () => {
    const mockPositions = [
      { id: 'pos-1', title: 'Frontend Developer', level: 'Junior' },
      { id: 'pos-2', title: 'Backend Developer', level: 'Senior' }
    ];

    mockPrisma.jobRole.findMany.mockResolvedValue(mockPositions);

    const { GET } = await import('@/app/api/positions/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockPositions);
  });

  it('should return 500 on database error', async () => {
    mockPrisma.jobRole.findMany.mockRejectedValue(new Error('DB Error'));

    const { GET } = await import('@/app/api/positions/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch job roles');
  });
});



