import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

vi.mock('../../services/openaiService', () => ({
  callOpenAI: vi.fn()
}));

describe('interviewService', () => {
  const getAI = async () => (await import('../../services/openaiService')).callOpenAI as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('extractTopics returns unique topics when introduction is valid', async () => {
    const callOpenAI = await getAI();
    callOpenAI.mockResolvedValue({ choices: [ { message: { content: JSON.stringify({
      isIntroduction: true,
      skills: ['React','TypeScript'],
      experience: ['3 years dev'],
      projects: ['Project A'],
      education: ['BS CS'],
      softSkills: ['Teamwork']
    }) } } ] });

    const { extractTopics } = await import('../../services/interviewService');
    const result = await extractTopics('Hi, I am a frontend developer...');

    expect(result).toEqual(expect.arrayContaining(['React','TypeScript','3 years dev','Project A','BS CS','Teamwork']));
    // should be unique
    const unique = Array.from(new Set(result));
    expect(unique.length).toBe(result.length);
  });

  it('extractTopics returns empty when not an introduction or on error', async () => {
    const callOpenAI = await getAI();
    callOpenAI.mockResolvedValueOnce({ choices: [ { message: { content: JSON.stringify({ isIntroduction: false }) } } ] })
               .mockRejectedValueOnce(new Error('Network'));

    const { extractTopics } = await import('../../services/interviewService');

    const notIntro = await extractTopics('Random text');
    expect(notIntro).toEqual([]);

    const onError = await extractTopics('Will fail');
    expect(onError).toEqual([]);
  });

  it('generateQuestionsForTopic parses questions or returns empty / fallback on error', async () => {
    const callOpenAI = await getAI();
    callOpenAI.mockResolvedValueOnce({ choices: [ { message: { content: JSON.stringify({ questions: ['Q1','Q2'] }) } } ] })
               .mockResolvedValueOnce({ choices: [ { message: { content: JSON.stringify({ wrong: true }) } } ] })
               .mockRejectedValueOnce(new Error('Network'));

    const { generateQuestionsForTopic } = await import('../../services/interviewService');

    const ok = await generateQuestionsForTopic('React','junior','Frontend');
    expect(ok).toEqual(['Q1','Q2']);

    const invalid = await generateQuestionsForTopic('React');
    expect(invalid).toEqual([]);

    const fallback = await generateQuestionsForTopic('React');
    expect(fallback[0]).toMatch(/Could not generate questions/);
  });

  it('getNextInterviewStep returns trimmed content or fallback on error', async () => {
    const callOpenAI = await getAI();
    callOpenAI.mockResolvedValueOnce({ choices: [ { message: { content: ' Ask: Q1  ' } } ] })
               .mockRejectedValueOnce(new Error('Network'));

    const { getNextInterviewStep } = await import('../../services/interviewService');

    const text = await getNextInterviewStep({ currentQuestion: 'Q1', previousAnswers: [], phase: 'ask' });
    expect(text).toBe('Ask: Q1');

    const fallback = await getNextInterviewStep({ currentQuestion: 'Q1', previousAnswers: [], phase: 'feedback', lastUserAnswer: 'A' });
    expect(fallback).toMatch(/Sorry, an error occurred/);
  });

  it('evaluateAnswer parses evaluation and flags irrelevance for short answers', async () => {
    const callOpenAI = await getAI();
    callOpenAI.mockResolvedValueOnce({ choices: [ { message: { content: JSON.stringify({
      isComplete: true,
      scores: { fundamental: 2, logic: 2, language: 2 },
      suggestions: { fundamental: 's1', logic: 's2', language: 's3' },
      strengths: ['a'],
      weaknesses: ['b'],
      missingPoints: ['x'],
      feedback: 'ok',
      suggestedImprovements: ['impr'],
      followUpQuestions: ['f1']
    }) } } ] })
    .mockRejectedValueOnce(new Error('Network'));

    const { evaluateAnswer } = await import('../../services/interviewService');

    const short = await evaluateAnswer('Q','short');
    expect(short.isRelevant).toBe(false);

    const fallback = await evaluateAnswer('Q','long enough');
    expect(fallback.weaknesses).toContain('Could not evaluate the answer');
  });
});






