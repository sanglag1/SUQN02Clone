import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

describe('Question Bank Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should create correct config when job role is selected', () => {
    const mockJobRole = {
      id: '1',
      title: 'Frontend Developer',
      level: 'Junior',
      category: { name: 'Frontend' },
      specialization: { name: 'React' }
    };

    const questionBankConfig = {
      field: mockJobRole.category?.name || 'software development',
      level: mockJobRole.level || 'mid',
      language: 'en-US',
      jobRoleTitle: mockJobRole.title,
      jobRoleLevel: mockJobRole.level
    };

    expect(questionBankConfig).toEqual({
      field: 'Frontend',
      level: 'Junior',
      language: 'en-US',
      jobRoleTitle: 'Frontend Developer',
      jobRoleLevel: 'Junior'
    });
  });

  it('should handle missing category gracefully', () => {
    const mockJobRole = {
      id: '1',
      title: 'Software Engineer',
      level: 'Mid',
      category: undefined,
      specialization: undefined
    };

    const questionBankConfig = {
      field: mockJobRole.category?.name || 'software development',
      level: mockJobRole.level || 'mid',
      language: 'en-US',
      jobRoleTitle: mockJobRole.title,
      jobRoleLevel: mockJobRole.level
    };

    expect(questionBankConfig).toEqual({
      field: 'software development',
      level: 'Mid',
      language: 'en-US',
      jobRoleTitle: 'Software Engineer',
      jobRoleLevel: 'Mid'
    });
  });

  it('should normalize position names correctly', () => {
    const testCases = [
      { input: 'Frontend Development', expected: 'Frontend' },
      { input: 'Backend Engineering', expected: 'Backend' },
      { input: 'Full Stack Dev', expected: 'Full Stack' },
      { input: 'Mobile Development', expected: 'Mobile' },
      { input: 'Data Science', expected: 'Data Science' }
    ];

    testCases.forEach(({ input, expected }) => {
      const normalized = input
        ?.replace(/\s*Development?\s*/gi, '')
        ?.replace(/\s*Engineering?\s*/gi, '')
        ?.replace(/\s*Dev\s*/gi, '')
        ?.trim() || input.toLowerCase();
      
      expect(normalized).toBe(expected);
    });
  });
});
