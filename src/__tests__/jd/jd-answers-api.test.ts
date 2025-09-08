import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET, DELETE } from '@/app/api/jd-answers/route';

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/services/jdAnswerService', () => ({
  JdAnswerService: {
    saveAnswer: vi.fn(),
    getAnswer: vi.fn(),
    updateAnswerWithAnalysis: vi.fn(),
    getAllAnswers: vi.fn(),
    deleteAnswer: vi.fn(),
    getAnswersByQuestionSet: vi.fn(),
    getUserAnswerHistory: vi.fn(),
    getUserStats: vi.fn(),
  },
}));

vi.mock('@/services/userActivityService', () => ({
  UserActivityService: {
    addActivity: vi.fn(),
  },
}));

vi.mock('@prisma/client', () => ({
  ActivityType: {
    jd: 'jd',
  },
}));

describe('JD Answers API', () => {
  const mockUserId = 'user-123';
  const mockJdQuestionSetId = 'question-set-123';
  const mockQuestionIndex = 0;
  const mockQuestionText = 'What is React?';
  const mockUserAnswer = 'React is a JavaScript library for building user interfaces.';
  const mockTimeSpent = 120;

  const mockAnalysisResult = {
    feedback: 'Great answer! You clearly understand React fundamentals.',
    detailedScores: { technical: 8, communication: 9 },
    overallScore: 8.5,
    strengths: ['Clear explanation', 'Good examples'],
    improvements: ['Could mention more advanced concepts'],
    skillAssessment: {
      level: 'intermediate',
      recommendedNextLevel: 'advanced',
      suggestions: ['Study React patterns', 'Learn advanced hooks']
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/jd-answers', () => {
    it('should successfully create a new JD answer', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: mockUserId });

      const { JdAnswerService } = await import('@/services/jdAnswerService');
      (JdAnswerService.getAnswer as any).mockResolvedValue(null);
      (JdAnswerService.saveAnswer as any).mockResolvedValue({ id: 'answer-123' });

      const { UserActivityService } = await import('@/services/userActivityService');
      (UserActivityService.addActivity as any).mockResolvedValue(undefined);

      const requestBody = {
        jdQuestionSetId: mockJdQuestionSetId,
        questionIndex: mockQuestionIndex,
        questionText: mockQuestionText,
        userAnswer: mockUserAnswer,
        analysisResult: mockAnalysisResult,
        timeSpent: mockTimeSpent
      };

      const request = new NextRequest('http://localhost:3000/api/jd-answers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(JdAnswerService.saveAnswer).toHaveBeenCalledWith({
        userId: mockUserId,
        jdQuestionSetId: mockJdQuestionSetId,
        questionIndex: mockQuestionIndex,
        questionText: mockQuestionText,
        userAnswer: mockUserAnswer,
        timeSpent: mockTimeSpent,
        feedback: mockAnalysisResult.feedback,
        scores: mockAnalysisResult.detailedScores,
        overallScore: mockAnalysisResult.overallScore,
        strengths: mockAnalysisResult.strengths,
        improvements: mockAnalysisResult.improvements,
        skillAssessment: mockAnalysisResult.skillAssessment,
      });
    });

    it('should update existing answer if it already exists', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: mockUserId });

      const { JdAnswerService } = await import('@/services/jdAnswerService');
      (JdAnswerService.getAnswer as any).mockResolvedValue({ id: 'existing-answer-123' });
      (JdAnswerService.updateAnswerWithAnalysis as any).mockResolvedValue({ id: 'existing-answer-123' });

      const { UserActivityService } = await import('@/services/userActivityService');
      (UserActivityService.addActivity as any).mockResolvedValue(undefined);

      const requestBody = {
        jdQuestionSetId: mockJdQuestionSetId,
        questionIndex: mockQuestionIndex,
        questionText: mockQuestionText,
        userAnswer: mockUserAnswer,
        analysisResult: mockAnalysisResult,
        timeSpent: mockTimeSpent
      };

      const request = new NextRequest('http://localhost:3000/api/jd-answers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(JdAnswerService.updateAnswerWithAnalysis).toHaveBeenCalledWith(
        'existing-answer-123',
        mockAnalysisResult
      );
    });

    it('should return 401 if user is not authenticated', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: null });

      const requestBody = {
        jdQuestionSetId: mockJdQuestionSetId,
        questionIndex: mockQuestionIndex,
        questionText: mockQuestionText,
        userAnswer: mockUserAnswer,
      };

      const request = new NextRequest('http://localhost:3000/api/jd-answers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Unauthorized');
    });

    it('should return 400 if required fields are missing', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: mockUserId });

      const requestBody = {
        jdQuestionSetId: mockJdQuestionSetId,
        // Missing questionIndex, questionText, userAnswer
      };

      const request = new NextRequest('http://localhost:3000/api/jd-answers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain('Missing required fields');
    });

    it('should handle missing analysis result gracefully', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: mockUserId });

      const { JdAnswerService } = await import('@/services/jdAnswerService');
      (JdAnswerService.getAnswer as any).mockResolvedValue(null);
      (JdAnswerService.saveAnswer as any).mockResolvedValue({ id: 'answer-123' });

      const { UserActivityService } = await import('@/services/userActivityService');
      (UserActivityService.addActivity as any).mockResolvedValue(undefined);

      const requestBody = {
        jdQuestionSetId: mockJdQuestionSetId,
        questionIndex: mockQuestionIndex,
        questionText: mockQuestionText,
        userAnswer: mockUserAnswer,
        timeSpent: mockTimeSpent
        // No analysisResult
      };

      const request = new NextRequest('http://localhost:3000/api/jd-answers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(JdAnswerService.saveAnswer).toHaveBeenCalledWith({
        userId: mockUserId,
        jdQuestionSetId: mockJdQuestionSetId,
        questionIndex: mockQuestionIndex,
        questionText: mockQuestionText,
        userAnswer: mockUserAnswer,
        timeSpent: mockTimeSpent,
        // Should not have analysis fields
      });
    });

    it('should track user activity successfully', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: mockUserId });

      const { JdAnswerService } = await import('@/services/jdAnswerService');
      (JdAnswerService.getAnswer as any).mockResolvedValue(null);
      (JdAnswerService.saveAnswer as any).mockResolvedValue({ id: 'answer-123' });

      const { UserActivityService } = await import('@/services/userActivityService');
      (UserActivityService.addActivity as any).mockResolvedValue(undefined);

      const requestBody = {
        jdQuestionSetId: mockJdQuestionSetId,
        questionIndex: mockQuestionIndex,
        questionText: mockQuestionText,
        userAnswer: mockUserAnswer,
        timeSpent: mockTimeSpent
      };

      const request = new NextRequest('http://localhost:3000/api/jd-answers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      await POST(request);

      expect(UserActivityService.addActivity).toHaveBeenCalledWith(mockUserId, {
        type: 'jd',
        referenceId: mockJdQuestionSetId,
        score: undefined,
        duration: mockTimeSpent,
        timestamp: expect.any(Date)
      });
    });

    it('should continue operation even if activity tracking fails', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: mockUserId });

      const { JdAnswerService } = await import('@/services/jdAnswerService');
      (JdAnswerService.getAnswer as any).mockResolvedValue(null);
      (JdAnswerService.saveAnswer as any).mockResolvedValue({ id: 'answer-123' });

      const { UserActivityService } = await import('@/services/userActivityService');
      (UserActivityService.addActivity as any).mockRejectedValue(new Error('Activity tracking failed'));

      const requestBody = {
        jdQuestionSetId: mockJdQuestionSetId,
        questionIndex: mockQuestionIndex,
        questionText: mockQuestionText,
        userAnswer: mockUserAnswer,
        timeSpent: mockTimeSpent
      };

      const request = new NextRequest('http://localhost:3000/api/jd-answers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const responseData = await response.json();

      // Should still succeed even if activity tracking fails
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
    });
  });

  describe('GET /api/jd-answers', () => {
    it('should return 401 if user is not authenticated', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/jd-answers');

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Unauthorized');
    });

    it('should successfully check if answer exists', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: mockUserId });

      const { JdAnswerService } = await import('@/services/jdAnswerService');
      (JdAnswerService.getAnswer as any).mockResolvedValue({ id: 'answer-1' });

      const request = new NextRequest('http://localhost:3000/api/jd-answers?type=check&questionSetId=set-123&questionIndex=0');

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.exists).toBe(true);
      expect(JdAnswerService.getAnswer).toHaveBeenCalledWith('set-123', 0, mockUserId);
    });

    it('should successfully fetch single answer', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: mockUserId });

      const { JdAnswerService } = await import('@/services/jdAnswerService');
      const mockAnswer = { id: 'answer-1', questionText: 'Question 1', userAnswer: 'Answer 1' };
      (JdAnswerService.getAnswer as any).mockResolvedValue(mockAnswer);

      const request = new NextRequest('http://localhost:3000/api/jd-answers?type=single&jdQuestionSetId=set-123&questionIndex=0');

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual(mockAnswer);
      expect(JdAnswerService.getAnswer).toHaveBeenCalledWith('set-123', 0, mockUserId);
    });

    it('should successfully fetch answers by question set', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: mockUserId });

      const { JdAnswerService } = await import('@/services/jdAnswerService');
      const mockAnswers = [
        { id: 'answer-1', questionText: 'Question 1', userAnswer: 'Answer 1' },
        { id: 'answer-2', questionText: 'Question 2', userAnswer: 'Answer 2' }
      ];
      (JdAnswerService.getAnswersByQuestionSet as any).mockResolvedValue(mockAnswers);

      const request = new NextRequest('http://localhost:3000/api/jd-answers?type=set&jdQuestionSetId=set-123');

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual(mockAnswers);
      expect(JdAnswerService.getAnswersByQuestionSet).toHaveBeenCalledWith('set-123', mockUserId);
    });

    it('should return 400 for invalid type parameter', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: mockUserId });

      const request = new NextRequest('http://localhost:3000/api/jd-answers?type=invalid');

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain('Invalid type parameter');
    });

    it('should return 400 for missing required parameters', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: mockUserId });

      const request = new NextRequest('http://localhost:3000/api/jd-answers?type=check');

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain('Missing questionSetId or questionIndex for check');
    });
  });

  describe('DELETE /api/jd-answers', () => {
    it('should return 401 if user is not authenticated', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/jd-answers?answerId=answer-123', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Unauthorized');
    });

    it('should successfully delete an answer', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: mockUserId });

      const { JdAnswerService } = await import('@/services/jdAnswerService');
      (JdAnswerService.deleteAnswer as any).mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/jd-answers?answerId=answer-123', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(JdAnswerService.deleteAnswer).toHaveBeenCalledWith('answer-123');
    });

    it('should return 400 if answerId is missing', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: mockUserId });

      const request = new NextRequest('http://localhost:3000/api/jd-answers', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Missing answerId parameter');
    });

    it('should handle service errors gracefully', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: mockUserId });

      const { JdAnswerService } = await import('@/services/jdAnswerService');
      (JdAnswerService.deleteAnswer as any).mockRejectedValue(new Error('Delete failed'));

      const request = new NextRequest('http://localhost:3000/api/jd-answers?answerId=answer-123', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Internal server error');
    });
  });

  describe('Data Validation', () => {
    it('should validate jdQuestionSetId is provided', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: mockUserId });

      const requestBody = {
        questionIndex: mockQuestionIndex,
        questionText: mockQuestionText,
        userAnswer: mockUserAnswer,
      };

      const request = new NextRequest('http://localhost:3000/api/jd-answers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain('jdQuestionSetId');
    });

    it('should validate questionIndex is provided', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: mockUserId });

      const requestBody = {
        jdQuestionSetId: mockJdQuestionSetId,
        questionText: mockQuestionText,
        userAnswer: mockUserAnswer,
      };

      const request = new NextRequest('http://localhost:3000/api/jd-answers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain('questionIndex');
    });

    it('should validate questionText is provided', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: mockUserId });

      const requestBody = {
        jdQuestionSetId: mockJdQuestionSetId,
        questionIndex: mockQuestionIndex,
        userAnswer: mockUserAnswer,
      };

      const request = new NextRequest('http://localhost:3000/api/jd-answers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain('questionText');
    });

    it('should validate userAnswer is provided', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: mockUserId });

      const requestBody = {
        jdQuestionSetId: mockJdQuestionSetId,
        questionIndex: mockQuestionIndex,
        questionText: mockQuestionText,
      };

      const request = new NextRequest('http://localhost:3000/api/jd-answers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain('userAnswer');
    });
  });

  describe('Error Handling', () => {
    it('should handle JSON parsing errors', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: mockUserId });

      const request = new NextRequest('http://localhost:3000/api/jd-answers', {
        method: 'POST',
        body: 'invalid-json',
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Internal server error');
    });

    it('should handle unexpected errors gracefully', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      (auth as any).mockResolvedValue({ userId: mockUserId });

      const { JdAnswerService } = await import('@/services/jdAnswerService');
      (JdAnswerService.getAnswer as any).mockRejectedValue(new Error('Unexpected error'));

      const requestBody = {
        jdQuestionSetId: mockJdQuestionSetId,
        questionIndex: mockQuestionIndex,
        questionText: mockQuestionText,
        userAnswer: mockUserAnswer,
      };

      const request = new NextRequest('http://localhost:3000/api/jd-answers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Internal server error');
    });
  });
});
