import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { ChatMessage } from '../../services/openaiService';

vi.mock('../../services/openaiService', () => ({
  callOpenAI: vi.fn()
}));

describe('evaluationService.generateInterviewEvaluation', () => {
  const getCallOpenAI = async () => (await import('../../services/openaiService')).callOpenAI as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const sampleConversation: ChatMessage[] = [
    { role: 'user', content: 'I built a React app with TypeScript and Redux' },
    { role: 'assistant', content: 'Tell me about your state management approach' }
  ];

  it('returns validated evaluation when AI returns proper JSON', async () => {
    const callOpenAI = await getCallOpenAI();
    callOpenAI.mockResolvedValue({
      ok: true,
      choices: [
        {
          message: {
            content: JSON.stringify({
              technicalScore: 9,
              communicationScore: 8,
              problemSolvingScore: 8,
              cultureFitScore: 7,
              overallRating: 8,
              technicalStrengths: ['Strong React knowledge'],
              technicalWeaknesses: ['Limited backend experience'],
              recommendations: ['Practice system design'],
              hiringRecommendation: 'hire',
              detailedFeedback: {
                technical: 'Excellent React patterns',
                softSkills: 'Communicates clearly',
                experience: 'Good project history',
                potential: 'High growth potential'
              },
              salary_range: { min: 1000, max: 2000, currency: 'USD' },
              levelAssessment: { currentLevel: 'mid', readinessForNextLevel: false, gapAnalysis: ['System design'] }
            })
          }
        }
      ]
    });

    const { generateInterviewEvaluation } = await import('../../services/evaluationService');

    const result = await generateInterviewEvaluation(sampleConversation, 'Frontend', 'Mid', 'en-US');

    expect(result.overallRating).toBe(8);
    expect(result.technicalStrengths).toContain('Strong React knowledge');
    expect(result.salary_range.currency).toBe('USD');
    expect(result.hiringRecommendation).toBe('hire');
  });

  it('handles markdown fenced JSON by stripping fences', async () => {
    const callOpenAI = await getCallOpenAI();
    callOpenAI.mockResolvedValue({
      choices: [
        {
          message: {
            content: '```json\n' + JSON.stringify({
              technicalScore: 7,
              communicationScore: 7,
              problemSolvingScore: 7,
              cultureFitScore: 7,
              overallRating: 7,
              technicalStrengths: [],
              technicalWeaknesses: [],
              recommendations: [],
              hiringRecommendation: 'consider',
              detailedFeedback: { technical: '', softSkills: '', experience: '', potential: '' },
              salary_range: { min: 900, max: 1800, currency: 'USD' }
            }) + '\n```'
          }
        }
      ]
    });

    const { generateInterviewEvaluation } = await import('../../services/evaluationService');
    const result = await generateInterviewEvaluation(sampleConversation, 'Frontend', 'Mid', 'en-US');

    expect(result.overallRating).toBe(7);
  });

  it('returns default evaluation when AI returns non-JSON', async () => {
    const callOpenAI = await getCallOpenAI();
    callOpenAI.mockResolvedValue({
      choices: [ { message: { content: 'Some analysis text without JSON' } } ]
    });

    const { generateInterviewEvaluation } = await import('../../services/evaluationService');
    const result = await generateInterviewEvaluation(sampleConversation, 'Frontend', 'Mid', 'en-US');

    // Defaults should be set and salary currency should be from criteria
    expect(result.overallRating).toBeGreaterThan(0);
    expect(result.salary_range.currency).toBeDefined();
  });

  it('validates and corrects invalid scores and fields', async () => {
    const callOpenAI = await getCallOpenAI();
    callOpenAI.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              technicalScore: 999,
              communicationScore: -3,
              problemSolvingScore: 'NaN',
              cultureFitScore: 11,
              overallRating: 0,
              technicalStrengths: 'not-an-array',
              technicalWeaknesses: null,
              recommendations: undefined,
              hiringRecommendation: 'unknown',
              detailedFeedback: {},
              salary_range: { currency: 'EUR' }
            })
          }
        }
      ]
    });

    const { generateInterviewEvaluation } = await import('../../services/evaluationService');
    const result = await generateInterviewEvaluation(sampleConversation, 'Frontend', 'Mid', 'en-US');

    // Out-of-range scores should be normalized to defaults
    expect(result.technicalScore).toBeGreaterThan(0);
    expect(Array.isArray(result.technicalStrengths)).toBe(true);
    expect(['strong_hire', 'hire', 'consider', 'reject']).toContain(result.hiringRecommendation);
  });

  it('returns default evaluation on error', async () => {
    const callOpenAI = await getCallOpenAI();
    callOpenAI.mockRejectedValue(new Error('Network error'));

    const { generateInterviewEvaluation } = await import('../../services/evaluationService');
    const result = await generateInterviewEvaluation(sampleConversation, 'Frontend', 'Senior', 'en-US');

    expect(result.overallRating).toBeGreaterThan(0);
    expect(result.salary_range.min).toBeLessThan(result.salary_range.max);
  });
});
