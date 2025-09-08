import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { ChatMessage } from '../../services/openaiService';

// Mocks
vi.mock('../../services/openaiService', () => ({
  callOpenAI: vi.fn()
}));

vi.mock('../../services/questionBankIntegration', () => ({
  createSystemMessageWithQuestionBank: vi.fn(async (field: string, level: string, specialization?: string, language?: string) => ({
    role: 'system',
    content: `Interview for ${field} ${level} ${specialization || ''} ${language || ''}`.trim()
  }))
}));

describe('Avatar-AI service', () => {
  const getCallOpenAI = async () => (await import('../../services/openaiService')).callOpenAI as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('processInterviewResponse', () => {
    it('parses AI JSON response and returns structured data', async () => {
      const mockAIJson = {
        answer: 'Answer about hooks',
        currentTopic: 'React Hooks',
        shouldMoveToNewTopic: true,
        followUpQuestion: 'What is useMemo?',
        interviewProgress: 40,
        isInterviewComplete: false,
        currentScore: 75,
        questionCount: 2
      };

      const callOpenAI = await getCallOpenAI();
      callOpenAI.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify(mockAIJson) } }
        ]
      });

      const { processInterviewResponse } = await import('../../services/Avatar-AI');

      const history: ChatMessage[] = [
        { role: 'system', content: 'Interview config' },
        { role: 'user', content: 'Tell me about useEffect' }
      ];

      const result = await processInterviewResponse('I used useEffect for side effects', history, 'en-US');

      expect(result.answer).toBe('Answer about hooks');
      expect(result.currentTopic).toBe('React Hooks');
      expect(result.shouldMoveToNewTopic).toBe(true);
      expect(result.followUpQuestion).toBeDefined();
      expect(result.interviewProgress).toBeGreaterThanOrEqual(0);
      expect(result.currentScore).toBe(75);
      expect(result.questionCount).toBe(2);
    });

    it('handles instruction to end interview', async () => {
      const callOpenAI = await getCallOpenAI();
      callOpenAI.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify({
            answer: 'Ending interview',
            currentTopic: 'wrap-up',
            shouldMoveToNewTopic: false,
            interviewProgress: 100,
            isInterviewComplete: true,
            currentScore: 80,
            questionCount: 5
          }) } }
        ]
      });

      const { processInterviewResponse } = await import('../../services/Avatar-AI');

      const result = await processInterviewResponse('INSTRUCTION: end the interview', [], 'en-US');

      expect(result.isInterviewComplete).toBe(true);
      expect(result.shouldMoveToNewTopic).toBe(false);
    });
  });

  describe('startInterview', () => {
    it('builds system message and returns initial greeting when AI responds invalid JSON', async () => {
      const callOpenAI = await getCallOpenAI();
      // Make AI return non-JSON so code uses fallback greeting
      callOpenAI.mockResolvedValue({
        choices: [ { message: { content: 'Hello there' } } ]
      });

      const { startInterview } = await import('../../services/Avatar-AI');

      const result = await startInterview({
        field: 'frontend development',
        level: 'junior',
        language: 'en-US',
        specialization: 'React'
      });

      expect(result.currentTopic).toBe('introduction');
      expect(result.isInterviewComplete).toBe(false);
      expect(typeof result.answer).toBe('string');
      expect(result.answer.toLowerCase()).toContain('hello');
    });

    it('parses AI JSON and returns structured first prompt', async () => {
      const callOpenAI = await getCallOpenAI();
      callOpenAI.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify({
            answer: 'Welcome to the interview! Please introduce yourself.',
            currentTopic: 'introduction',
            shouldMoveToNewTopic: false,
            interviewProgress: 0,
            isInterviewComplete: false,
            currentScore: 0,
            questionCount: 0
          }) } }
        ]
      });

      const { startInterview } = await import('../../services/Avatar-AI');

      const result = await startInterview({
        field: 'backend development',
        level: 'mid',
        language: 'en-US'
      });

      expect(result.answer).toContain('Welcome');
      expect(result.currentTopic).toBe('introduction');
      expect(result.questionCount).toBe(0);
    });
  });
});
