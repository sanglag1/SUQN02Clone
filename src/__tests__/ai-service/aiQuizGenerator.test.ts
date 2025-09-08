import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

vi.mock('../../services/azureAiservicesforJD', () => ({
  getAIResponse: vi.fn()
}));

describe('aiQuizGenerator.generateQuizQuestionsByAI', () => {
  const getAI = async () => (await import('../../services/azureAiservicesforJD')).getAIResponse as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns parsed questions when AI returns valid JSON array', async () => {
    const mockQuestions = [
      { question: 'Q1', options: ['A','B','C','D'], correct: [1], explanation: 'because' },
      { question: 'Q2', options: ['A','B','C','D'], correct: [0,2], explanation: 'since' }
    ];
    const getAIResponse = await getAI();
    getAIResponse.mockResolvedValue(JSON.stringify(mockQuestions));

    const { generateQuizQuestionsByAI } = await import('../../services/aiQuizGenerator');
    const result = await generateQuizQuestionsByAI({ field: 'Frontend', topic: 'React', level: 'junior', count: 2, language: 'en' });

    expect(result).toHaveLength(2);
    expect(result[0].question).toBe('Q1');
  });

  it('extracts partial questions when JSON is malformed', async () => {
    const malformed = '{ "question":"Q1","options":["A","B","C","D"],"correct":[1]}, {"question":"Q2"';
    const getAIResponse = await getAI();
    getAIResponse.mockResolvedValue(malformed);

    const { generateQuizQuestionsByAI } = await import('../../services/aiQuizGenerator');
    const result = await generateQuizQuestionsByAI({ field: 'Frontend', topic: 'React', level: 'junior', count: 2, language: 'en' });

    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('throws when generated less than 50% of requested after parsing failure', async () => {
    const getAIResponse = await getAI();
    getAIResponse.mockResolvedValue('not json and no partials');

    const { generateQuizQuestionsByAI } = await import('../../services/aiQuizGenerator');

    await expect(
      generateQuizQuestionsByAI({ field: 'Frontend', topic: 'React', level: 'junior', count: 4, language: 'en' })
    ).rejects.toThrow(/Failed to generate sufficient questions/);
  });

  it('batches when count exceeds batch size and aggregates results', async () => {
    const mockQuestionsBatch = Array.from({ length: 15 }, (_, i) => ({ question: `Q${i}`, options: ['A','B','C','D'], correct: [0], explanation: 'reason' }));
    const getAIResponse = await getAI();
    // First batch returns 15, second returns 5
    getAIResponse
      .mockResolvedValueOnce(JSON.stringify(mockQuestionsBatch))
      .mockResolvedValueOnce(JSON.stringify(mockQuestionsBatch.slice(0, 5)));

    const { generateQuizQuestionsByAI } = await import('../../services/aiQuizGenerator');
    const result = await generateQuizQuestionsByAI({ field: 'Frontend', topic: 'React', level: 'junior', count: 20, language: 'en' });

    expect(result).toHaveLength(20);
  });
});

