import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock OpenAI service
const mockOpenAIService = {
  generateResponse: vi.fn()
};

vi.mock('@/services/openaiService', () => ({
  callOpenAI: mockOpenAIService.generateResponse
}));

describe('evaluationService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('generateInterviewEvaluation', () => {
    it('should generate evaluation successfully', async () => {
      const mockInterview = {
        id: 'interview-123',
        jobRole: {
          title: 'Frontend Developer',
          level: 'junior'
        },
        conversationHistory: [
          { role: 'user', content: 'Hello, I am a developer' },
          { role: 'ai', content: 'Tell me about your experience' }
        ]
      };

      const mockAIResponse = {
        technicalScore: 8,
        communicationScore: 7,
        problemSolvingScore: 8,
        cultureFitScore: 7,
        overallRating: 7.5,
        technicalStrengths: ['Good technical knowledge', 'Problem solving skills'],
        technicalWeaknesses: ['Could improve communication'],
        recommendations: ['More practice', 'Better documentation'],
        hiringRecommendation: 'hire',
        detailedFeedback: {
          technical: 'Strong technical foundation',
          softSkills: 'Good communication',
          experience: 'Relevant experience',
          potential: 'High potential'
        },
        salary_range: {
          min: 15000000,
          max: 25000000,
          currency: 'VND'
        },
        levelAssessment: {
          currentLevel: 'junior',
          readinessForNextLevel: false,
          gapAnalysis: ['Need more experience', 'Improve communication']
        }
      };

      mockOpenAIService.generateResponse.mockResolvedValue(mockAIResponse);

      const { generateInterviewEvaluation } = await import('@/services/evaluationService');

      const result = await generateInterviewEvaluation(
        mockInterview.conversationHistory as any,
        'Frontend',
        'junior',
        'en-US'
      );

      expect(result).toBeDefined();
      expect(result.technicalScore).toBeGreaterThan(0);
      expect(result.communicationScore).toBeGreaterThan(0);
      expect(result.problemSolvingScore).toBeGreaterThan(0);
      expect(result.overallRating).toBeGreaterThan(0);
      expect(result.technicalStrengths).toBeDefined();
      expect(result.technicalWeaknesses).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.hiringRecommendation).toBeDefined();
      expect(result.detailedFeedback).toBeDefined();
      expect(result.salary_range).toBeDefined();
      expect(result.levelAssessment).toBeDefined();
    });

    it('should handle missing job role information', async () => {
      const mockInterview = {
        id: 'interview-123',
        jobRole: null,
        conversationHistory: []
      };

      const { generateInterviewEvaluation } = await import('@/services/evaluationService');

      const result = await generateInterviewEvaluation(
        mockInterview.conversationHistory as any,
        'Frontend',
        'junior',
        'en-US'
      );

      expect(result).toBeDefined();
      expect(result.technicalScore).toBeGreaterThan(0);
      expect(result.communicationScore).toBeGreaterThan(0);
      expect(result.problemSolvingScore).toBeGreaterThan(0);
      expect(result.overallRating).toBeGreaterThan(0);
    });

    it('should handle empty transcripts', async () => {
      const mockInterview = {
        id: 'interview-123',
        jobRole: {
          title: 'Frontend Developer',
          level: 'junior'
        },
        conversationHistory: []
      };

      const { generateInterviewEvaluation } = await import('@/services/evaluationService');

      const result = await generateInterviewEvaluation(
        mockInterview.conversationHistory as any,
        'Frontend',
        'junior',
        'en-US'
      );

      expect(result).toBeDefined();
      expect(result.overallRating).toBeGreaterThan(0);
    });

    it('should handle OpenAI service errors gracefully', async () => {
      const mockInterview = {
        id: 'interview-123',
        jobRole: {
          title: 'Frontend Developer',
          level: 'junior'
        },
        conversationHistory: []
      };

      mockOpenAIService.generateResponse.mockRejectedValue(new Error('OpenAI service error'));

      const { generateInterviewEvaluation } = await import('@/services/evaluationService');

      const result = await generateInterviewEvaluation(
        mockInterview.conversationHistory as any,
        'Frontend',
        'junior',
        'en-US'
      );

      expect(result).toBeDefined();
      expect(result.overallRating).toBeGreaterThan(0);
      // Should return default evaluation when service fails
      expect(result.hiringRecommendation).toBe('consider');
    });

    it('should handle different languages correctly', async () => {
      const mockInterview = {
        id: 'interview-123',
        jobRole: {
          title: 'Frontend Developer',
          level: 'junior'
        },
        conversationHistory: []
      };

      const { generateInterviewEvaluation } = await import('@/services/evaluationService');

      const resultVi = await generateInterviewEvaluation(
        mockInterview.conversationHistory as any,
        'Frontend',
        'junior',
        'vi-VN'
      );

      const resultEn = await generateInterviewEvaluation(
        mockInterview.conversationHistory as any,
        'Frontend',
        'junior',
        'en-US'
      );

      expect(resultVi).toBeDefined();
      expect(resultEn).toBeDefined();
      expect(resultVi.overallRating).toBeGreaterThan(0);
      expect(resultEn.overallRating).toBeGreaterThan(0);
    });

    it('should validate and normalize scores correctly', async () => {
      const mockInterview = {
        id: 'interview-123',
        jobRole: {
          title: 'Frontend Developer',
          level: 'junior'
        },
        conversationHistory: []
      };

      const mockAIResponse = {
        technicalScore: 15, // Invalid score > 10
        communicationScore: -5, // Invalid score < 0
        problemSolvingScore: 8.7, // Valid score
        cultureFitScore: 7,
        overallRating: 7.5,
        technicalStrengths: ['Good technical knowledge'],
        technicalWeaknesses: ['Could improve communication'],
        recommendations: ['More practice'],
        hiringRecommendation: 'hire',
        detailedFeedback: {
          technical: 'Strong technical foundation',
          softSkills: 'Good communication',
          experience: 'Relevant experience',
          potential: 'High potential'
        },
        salary_range: {
          min: 15000000,
          max: 25000000,
          currency: 'VND'
        },
        levelAssessment: {
          currentLevel: 'junior',
          readinessForNextLevel: false,
          gapAnalysis: ['Need more experience']
        }
      };

      mockOpenAIService.generateResponse.mockResolvedValue(mockAIResponse);

      const { generateInterviewEvaluation } = await import('@/services/evaluationService');

      const result = await generateInterviewEvaluation(
        mockInterview.conversationHistory as any,
        'Frontend',
        'junior',
        'en-US'
      );

      expect(result).toBeDefined();
      expect(result.technicalScore).toBeGreaterThan(0);
      expect(result.communicationScore).toBeGreaterThan(0);
      expect(result.problemSolvingScore).toBeGreaterThan(0);
      expect(result.overallRating).toBeGreaterThan(0);
    });

    it('should handle different job fields correctly', async () => {
      const mockInterview = {
        id: 'interview-123',
        jobRole: {
          title: 'Backend Developer',
          level: 'senior'
        },
        conversationHistory: []
      };

      const { generateInterviewEvaluation } = await import('@/services/evaluationService');

      const result = await generateInterviewEvaluation(
        mockInterview.conversationHistory as any,
        'Backend',
        'senior',
        'en-US'
      );

      expect(result).toBeDefined();
      expect(result.overallRating).toBeGreaterThan(0);
      expect(result.salary_range).toBeDefined();
      expect(result.salary_range.currency).toBe('VND');
    });
  });
});
