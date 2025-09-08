import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

vi.mock('../../services/questionBankIntegration', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    createInterviewContextWithQuestionBank: vi.fn(async (field: string, level: string, topic?: string, questionCount?: number) => ({
      questions: [],
      contextPrompt: `Context for ${field} ${level} ${topic || ''} (${questionCount})`.trim(),
      usedQuestionIds: []
    }))
  };
});

describe('Question Bank Integration with Avatar-AI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should integrate question bank context with Avatar-AI', async () => {
    // Mock successful API response
    const mockQuestions = [
      {
        id: '1',
        question: 'What is React?',
        answers: [
          { content: 'A JavaScript library', isCorrect: true },
          { content: 'A programming language', isCorrect: false }
        ],
        fields: ['Frontend Development'],
        topics: ['React'],
        levels: ['junior'],
        explanation: 'React is a JavaScript library for building user interfaces'
      }
    ];

    const mockContextPrompt = `You are conducting a technical interview for a Junior level Frontend Developer position.

QUESTION BANK REFERENCE:
Use these questions as inspiration for your interview:

Question: What is React?

Options:
A. A JavaScript library
B. A programming language

Correct Answer(s): A

Explanation: React is a JavaScript library for building user interfaces

---

IMPORTANT: You can:
1. Ask these questions directly
2. Use them as inspiration to create similar questions
3. Adapt them based on the candidate's responses
4. Ask follow-up questions based on these topics

Ask exactly 10 technical questions and maintain a professional but friendly tone.`;

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        questions: mockQuestions,
        contextPrompt: mockContextPrompt,
        usedQuestionIds: ['1'],
        jobRoleMapping: {
          jobRoleKey: 'frontend_developer_junior',
          jobRoleTitle: 'Frontend Developer',
          jobRoleLevel: 'Junior',
          categoryName: 'Frontend',
          skills: ['HTML', 'CSS', 'JavaScript', 'React'],
          interviewFocusAreas: ['Basic HTML/CSS knowledge', 'JavaScript fundamentals', 'React basics']
        }
      })
    });

    // Test that the integration works
    const { processInterviewResponse } = await import('../../services/Avatar-AI');
    
    const config = {
      field: 'Frontend',
      level: 'Junior',
      language: 'en-US' as const,
      jobRoleTitle: 'Frontend Developer',
      jobRoleLevel: 'Junior'
    };

    const result = await processInterviewResponse(
      'Hello, I am ready for the interview',
      [],
      'en-US',
      config
    );

    expect(result).toBeDefined();
    expect(result.answer).toBeDefined();
    expect(result.currentTopic).toBeDefined();
    expect(result.interviewProgress).toBeGreaterThanOrEqual(0);
    expect(result.isInterviewComplete).toBe(false);
  });

  it('should handle question bank API errors gracefully', async () => {
    // Mock API error
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const { processInterviewResponse } = await import('../../services/Avatar-AI');
    
    const config = {
      field: 'Frontend',
      level: 'Junior',
      language: 'en-US' as const,
      jobRoleTitle: 'Frontend Developer',
      jobRoleLevel: 'Junior'
    };

    const result = await processInterviewResponse(
      'Hello, I am ready for the interview',
      [],
      'en-US',
      config
    );

    // Should still work without question bank context
    expect(result).toBeDefined();
    expect(result.answer).toBeDefined();
    expect(result.isInterviewComplete).toBe(false);
  });

  it('should work without config (backward compatibility)', async () => {
    const { processInterviewResponse } = await import('../../services/Avatar-AI');
    
    const result = await processInterviewResponse(
      'Hello, I am ready for the interview',
      [],
      'en-US'
      // No config passed
    );

    expect(result).toBeDefined();
    expect(result.answer).toBeDefined();
    expect(result.isInterviewComplete).toBe(false);
  });
});
