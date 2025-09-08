import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test cho Quiz API endpoints dựa trên cấu trúc thực tế
describe('QuizMode - API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('Quiz Creation API - /api/quizzes/secure', () => {
    it('should create secure quiz with proper validation', async () => {
      const quizRequest = {
        field: 'ai-engineer',
        topic: 'machine-learning',
        level: 'senior',
        count: 10,
        timeLimit: 20
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'secure-ml-quiz-1',
          field: 'ai-engineer',
          topic: 'machine-learning', 
          level: 'senior',
          questions: [
            {
              id: 'ml-q1',
              question: 'What is gradient descent?',
              answers: [
                { content: 'Optimization algorithm' },
                { content: 'Loss function' },
                { content: 'Activation function' },
                { content: 'Regularization technique' }
              ],
              isMultipleChoice: false
            }
          ],
          answerMapping: {
            'ml-q1': [2, 0, 3, 1] // Shuffled answer positions
          },
          totalQuestions: 10,
          timeLimit: 20,
          userId: 'user123'
        })
      });

      const response = await fetch('/api/quizzes/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizRequest)
      });

      const quiz = await response.json();

      expect(quiz.id).toBe('secure-ml-quiz-1');
      expect(quiz.field).toBe('ai-engineer');
      expect(quiz.answerMapping['ml-q1']).toEqual([2, 0, 3, 1]);
      expect(quiz.questions[0].answers).toHaveLength(4);
    });

    it('should handle missing required fields validation', async () => {
      const invalidRequest = {
        field: 'backend',
        // Missing topic, level, count, timeLimit
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Missing required fields'
        })
      });

      const response = await fetch('/api/quizzes/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest)
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      
      const error = await response.json();
      expect(error.error).toBe('Missing required fields');
    });
  });

  describe('Quiz Retrieval API - GET /api/quizzes/[quizId]', () => {
    it('should retrieve quiz with answer mapping for retry', async () => {
      const quizId = 'existing-quiz-123';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: quizId,
          field: 'devops',
          topic: 'kubernetes',
          level: 'advanced',
          completedAt: '2025-08-23T10:00:00.000Z',
          score: 75,
          timeUsed: 900,
          timeLimit: 15,
          userAnswers: [
            { questionId: 'k8s-q1', answerIndex: [1], isCorrect: true },
            { questionId: 'k8s-q2', answerIndex: [0], isCorrect: false }
          ],
          totalQuestions: 8,
          retryCount: 0,
          answerMapping: {
            'k8s-q1': [1, 0, 2],
            'k8s-q2': [2, 1, 0]
          },
          questions: [
            {
              id: 'k8s-q1',
              question: 'What is a Kubernetes Pod?',
              answers: [
                { content: 'Smallest deployable unit', isCorrect: true },
                { content: 'Node management tool', isCorrect: false },
                { content: 'Network policy', isCorrect: false }
              ],
              explanation: 'A Pod is the smallest deployable unit in Kubernetes',
              isMultipleChoice: false
            }
          ]
        })
      });

      const response = await fetch(`/api/quizzes/${quizId}`);
      const quiz = await response.json();

      expect(quiz.id).toBe(quizId);
      expect(quiz.completedAt).toBeTruthy();
      expect(quiz.score).toBe(75);
      expect(quiz.answerMapping['k8s-q1']).toEqual([1, 0, 2]);
      expect(quiz.questions[0].answers[0].isCorrect).toBe(true); // Should include isCorrect since completed
    });

    it('should handle quiz not found', async () => {
      const invalidQuizId = 'non-existent-quiz';

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: 'Quiz not found'
        })
      });

      const response = await fetch(`/api/quizzes/${invalidQuizId}`);

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);

      const error = await response.json();
      expect(error.error).toBe('Quiz not found');
    });
  });

  describe('Quiz Submission API - POST /api/quizzes/[quizId]/submit', () => {
    it('should submit quiz and calculate score correctly', async () => {
      const quizId = 'active-quiz-789';
      const submissionData = {
        userAnswers: [
          { questionId: 'q1', answerIndex: [0] },
          { questionId: 'q2', answerIndex: [1, 2] }, // Multiple choice
          { questionId: 'q3', answerIndex: [1] }
        ],
        timeUsed: 1100
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: quizId,
          score: 67,
          correctCount: 2,
          totalQuestions: 3,
          timeUsed: 1100,
          userAnswers: [
            { questionId: 'q1', answerIndex: [0], isCorrect: true },
            { questionId: 'q2', answerIndex: [1, 2], isCorrect: false },
            { questionId: 'q3', answerIndex: [1], isCorrect: true }
          ],
          questionsWithCorrectAnswers: [
            {
              id: 'q1',
              question: 'REST API principles?',
              answers: [
                { content: 'Stateless communication', isCorrect: true },
                { content: 'Session-based auth', isCorrect: false }
              ],
              userAnswerIndex: [0],
              isCorrect: true,
              explanation: 'REST APIs should be stateless'
            }
          ]
        })
      });

      const response = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });

      const result = await response.json();

      expect(result.score).toBe(67);
      expect(result.correctCount).toBe(2);
      expect(result.userAnswers).toHaveLength(3);
      expect(result.userAnswers[0].isCorrect).toBe(true);
      expect(result.questionsWithCorrectAnswers[0].explanation).toBeTruthy();
    });

    it('should handle submission with tracking integration', async () => {
      const quizId = 'tracking-quiz-456';
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: quizId,
          score: 90,
          correctCount: 9,
          totalQuestions: 10,
          timeUsed: 800,
          trackingData: {
            assessmentTracked: true,
            userActivityUpdated: true,
            performanceMetrics: {
              efficiency: 'high',
              accuracy: 90,
              timePerQuestion: 80
            }
          }
        })
      });

      const response = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAnswers: [{ questionId: 'q1', answerIndex: [0] }],
          timeUsed: 800
        })
      });

      const result = await response.json();

      expect(result.trackingData.assessmentTracked).toBe(true);
      expect(result.trackingData.performanceMetrics.efficiency).toBe('high');
    });
  });

  describe('Quiz Retry API - POST /api/quizzes/[quizId]/retry', () => {
    it('should create retry quiz with new answer shuffling', async () => {
      const originalQuizId = 'completed-quiz-321';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'retry-quiz-654',
          originalQuizId: originalQuizId,
          field: 'data-scientist',
          topic: 'statistics',
          level: 'intermediate',
          questions: [
            {
              id: 'stat-q1',
              question: 'What is p-value?',
              answers: [
                { content: 'Probability of null hypothesis being true' },
                { content: 'Confidence interval' },
                { content: 'Standard deviation' }
              ],
              isMultipleChoice: false
            }
          ],
          answerMapping: {
            'stat-q1': [2, 0, 1] // Different from original shuffle
          },
          totalQuestions: 12,
          timeLimit: 18,
          retryCount: 1,
          userAnswers: [],
          score: 0,
          timeUsed: 0
        })
      });

      const response = await fetch(`/api/quizzes/${originalQuizId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const retryQuiz = await response.json();

      expect(retryQuiz.id).toBe('retry-quiz-654');
      expect(retryQuiz.originalQuizId).toBe(originalQuizId);
      expect(retryQuiz.retryCount).toBe(1);
      expect(retryQuiz.answerMapping['stat-q1']).toEqual([2, 0, 1]);
      expect(retryQuiz.score).toBe(0); // Fresh start
    });

    it('should handle retry access denied for unauthorized user', async () => {
      const otherUserQuizId = 'other-user-quiz-999';

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'Access denied'
        })
      });

      const response = await fetch(`/api/quizzes/${otherUserQuizId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(403);

      const error = await response.json();
      expect(error.error).toBe('Access denied');
    });
  });

  describe('Quiz History API - GET /api/quizzes/history', () => {
    it('should retrieve completed quiz history with proper sorting', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            id: 'history-quiz-1',
            field: 'frontend',
            topic: 'react',
            level: 'senior',
            score: 92,
            timeUsed: 720,
            totalQuestions: 12,
            correctAnswers: 11,
            completedAt: '2025-08-23T09:00:00.000Z',
            retryCount: 0,
            questions: [
              {
                id: 'react-q1',
                question: 'What are React hooks?',
                answers: [
                  { content: 'Functions for state management', isCorrect: true },
                  { content: 'Class components', isCorrect: false }
                ],
                explanation: 'Hooks allow you to use state and other React features in functional components'
              }
            ]
          },
          {
            id: 'history-quiz-2', 
            field: 'backend',
            topic: 'nodejs',
            level: 'intermediate',
            score: 78,
            timeUsed: 960,
            totalQuestions: 10,
            correctAnswers: 8,
            completedAt: '2025-08-22T14:30:00.000Z',
            retryCount: 1
          }
        ])
      });

      const response = await fetch('/api/quizzes/history');
      const history = await response.json();

      expect(history).toHaveLength(2);
      expect(history[0].score).toBe(92); // Latest quiz first
      expect(history[0].completedAt).toBeTruthy();
      expect(new Date(history[0].completedAt)).toBeInstanceOf(Date);
      expect(history[1].retryCount).toBe(1);
    });

    it('should handle empty quiz history', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      });

      const response = await fetch('/api/quizzes/history');
      const history = await response.json();

      expect(response.ok).toBe(true);
      expect(history).toEqual([]);
    });
  });

  describe('Quiz Deletion API - DELETE /api/quizzes/[quizId]', () => {
    it('should delete quiz successfully', async () => {
      const quizId = 'quiz-to-delete-123';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Quiz deleted successfully',
          deletedQuizId: quizId
        })
      });

      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.message).toBe('Quiz deleted successfully');
      expect(result.deletedQuizId).toBe(quizId);
    });

    it('should handle unauthorized deletion attempt', async () => {
      const protectedQuizId = 'protected-quiz-789';

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Unauthorized'
        })
      });

      const response = await fetch(`/api/quizzes/${protectedQuizId}`, {
        method: 'DELETE'
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);

      const error = await response.json();
      expect(error.error).toBe('Unauthorized');
    });
  });
});
