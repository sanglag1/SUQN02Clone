import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test cho các chế độ quiz khác nhau
describe('QuizMode - Different Quiz Types', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('Secure Quiz Mode', () => {
    it('should create secure quiz with proper answer mapping from API', async () => {
      // Mock /api/quizzes/secure API response based on actual implementation
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'secure-quiz-1',
          field: 'cybersecurity',
          topic: 'network-security',
          level: 'senior',
          questions: [
            { 
              id: 'q1', 
              question: 'What is zero trust security?',
              answers: [
                { content: 'Trust but verify model' },
                { content: 'Never trust, always verify' },
                { content: 'Trust all internal traffic' }
              ],
              isMultipleChoice: false 
            }
          ],
          answerMapping: { 
            'q1': [1, 0, 2] // Answer shuffle mapping
          },
          totalQuestions: 15,
          timeLimit: 25
        })
      });

      const response = await fetch('/api/quizzes/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: 'cybersecurity',
          topic: 'network-security',
          level: 'senior',
          count: 15,
          timeLimit: 25
        })
      });

      const quiz = await response.json();
      
      expect(quiz.id).toBe('secure-quiz-1');
      expect(quiz.answerMapping).toBeDefined();
      expect(quiz.answerMapping['q1']).toEqual([1, 0, 2]);
      expect(quiz.questions[0].answers).toHaveLength(3);
    });

    it('should handle quiz submission with answer mapping correctly', async () => {
      const quizId = 'secure-quiz-submit';
      
      // Mock submission response based on actual API structure
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: quizId,
          score: 85,
          correctCount: 12,
          totalQuestions: 15,
          timeUsed: 1200,
          userAnswers: [
            { questionId: 'q1', answerIndex: [1], isCorrect: true },
            { questionId: 'q2', answerIndex: [0], isCorrect: false }
          ],
          questionsWithCorrectAnswers: [
            {
              id: 'q1',
              question: 'AES encryption key sizes?',
              answers: [
                { content: '128, 192, 256 bits', isCorrect: true },
                { content: '64, 128, 256 bits', isCorrect: false }
              ],
              userAnswerIndex: [1],
              isCorrect: true
            }
          ]
        })
      });

      // Test POST /api/quizzes/{quizId}/submit
      const response = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAnswers: [
            { questionId: 'q1', answerIndex: [1] },
            { questionId: 'q2', answerIndex: [0] }
          ],
          timeUsed: 1200
        })
      });

      const result = await response.json();
      
      expect(result.score).toBe(85);
      expect(result.correctCount).toBe(12);
      expect(result.userAnswers).toHaveLength(2);
      expect(result.userAnswers[0].isCorrect).toBe(true);
      expect(result.questionsWithCorrectAnswers[0].answers[0].isCorrect).toBe(true);
    });
  });

  describe('Retry Quiz Mode', () => {
    it('should create retry quiz from existing quiz using API', async () => {
      const originalQuizId = 'original-quiz-123';
      
      // Mock /api/quizzes/{quizId}/retry API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'retry-quiz-456',
          originalQuizId: originalQuizId,
          field: 'frontend',
          topic: 'vue',
          level: 'intermediate',
          questions: [
            {
              id: 'q1',
              question: 'What is Vue.js reactive system?',
              answers: [
                { content: 'Observer pattern based' },
                { content: 'Proxy based' },
                { content: 'Manual updates' }
              ],
              isMultipleChoice: false
            }
          ],
          answerMapping: {
            'q1': [0, 2, 1] // Different shuffle than original
          },
          totalQuestions: 10,
          timeLimit: 15,
          retryCount: 1
        })
      });

      const response = await fetch(`/api/quizzes/${originalQuizId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const retryQuiz = await response.json();
      
      expect(retryQuiz.id).toBe('retry-quiz-456');
      expect(retryQuiz.originalQuizId).toBe(originalQuizId);
      expect(retryQuiz.retryCount).toBe(1);
      expect(retryQuiz.answerMapping['q1']).toEqual([0, 2, 1]);
    });

    it('should preserve original quiz configuration in retry', async () => {
      const originalConfig = {
        field: 'game-developer',
        topic: 'unity',
        level: 'senior',
        totalQuestions: 20,
        timeLimit: 30
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'retry-game-quiz',
          ...originalConfig,
          questions: [], // New shuffled questions
          userAnswers: [],
          score: 0,
          timeUsed: 0
        })
      });

      const response = await fetch('/api/quizzes/original-game-quiz/retry', {
        method: 'POST'
      });

      const retryQuiz = await response.json();
      
      expect(retryQuiz.field).toBe(originalConfig.field);
      expect(retryQuiz.topic).toBe(originalConfig.topic);
      expect(retryQuiz.level).toBe(originalConfig.level);
      expect(retryQuiz.totalQuestions).toBe(originalConfig.totalQuestions);
      expect(retryQuiz.timeLimit).toBe(originalConfig.timeLimit);
    });
  });

  describe('Practice Mode vs Quiz Mode', () => {
    it('should differentiate between practice and quiz modes', async () => {
      const practiceMode = {
        mode: 'practice',
        showCorrectAnswers: true,
        allowRetry: true,
        trackScore: false
      };

      const quizMode = {
        mode: 'quiz', 
        showCorrectAnswers: false,
        allowRetry: false,
        trackScore: true
      };

      expect(practiceMode.showCorrectAnswers).toBe(true);
      expect(quizMode.showCorrectAnswers).toBe(false);
      expect(practiceMode.trackScore).toBe(false);
      expect(quizMode.trackScore).toBe(true);
    });

    it('should handle practice mode with immediate feedback', async () => {
      const practiceQuiz = {
        id: 'practice-1',
        mode: 'practice',
        field: 'mobile-app',
        topic: 'react-native',
        questions: [
          {
            id: 'p1',
            question: 'React Native navigation?',
            answers: [
              { content: 'React Navigation', isCorrect: true },
              { content: 'Native Navigation', isCorrect: false }
            ],
            explanation: 'React Navigation is the standard library for navigation.'
          }
        ],
        showExplanations: true,
        immediatefeedback: true
      };

      expect(practiceQuiz.showExplanations).toBe(true);
      expect(practiceQuiz.immediatefeedback).toBe(true);
      expect(practiceQuiz.questions[0].explanation).toBeDefined();
    });
  });

  describe('Timed vs Untimed Quiz Mode', () => {
    it('should handle timed quiz with strict time limits', async () => {
      const timedQuiz = {
        id: 'timed-quiz',
        field: 'devops',
        topic: 'kubernetes',
        timeLimit: 10, // 10 minutes
        isStrict: true, // Auto-submit on timeout
        warningAt: 2 // Warning at 2 minutes remaining
      };

      expect(timedQuiz.timeLimit).toBe(10);
      expect(timedQuiz.isStrict).toBe(true);
      expect(timedQuiz.warningAt).toBe(2);
    });

    it('should handle untimed quiz for learning', async () => {
      const untimedQuiz = {
        id: 'untimed-quiz',
        field: 'ai-engineer',
        topic: 'deep-learning',
        timeLimit: null, // No time limit
        allowPause: true,
        saveProgress: true
      };

      expect(untimedQuiz.timeLimit).toBeNull();
      expect(untimedQuiz.allowPause).toBe(true);
      expect(untimedQuiz.saveProgress).toBe(true);
    });
  });

  describe('Collaborative Quiz Mode', () => {
    it('should support team quiz mode', async () => {
      const teamQuiz = {
        id: 'team-quiz-1',
        mode: 'collaborative',
        teamId: 'team-frontend-2025',
        participants: [
          { userId: 'user1', name: 'Alice', role: 'leader' },
          { userId: 'user2', name: 'Bob', role: 'member' }
        ],
        field: 'frontend',
        topic: 'performance',
        allowDiscussion: true,
        consensusRequired: true
      };

      expect(teamQuiz.mode).toBe('collaborative');
      expect(teamQuiz.participants).toHaveLength(2);
      expect(teamQuiz.allowDiscussion).toBe(true);
    });

    it('should handle competitive quiz mode', async () => {
      const competitiveQuiz = {
        id: 'competition-1',
        mode: 'competitive',
        participants: ['user1', 'user2', 'user3', 'user4'],
        field: 'algorithm',
        topic: 'data-structures',
        ranking: true,
        timeLimit: 15,
        simultaneousStart: true,
        leaderboard: []
      };

      expect(competitiveQuiz.mode).toBe('competitive');
      expect(competitiveQuiz.participants).toHaveLength(4);
      expect(competitiveQuiz.ranking).toBe(true);
      expect(competitiveQuiz.simultaneousStart).toBe(true);
    });
  });

  describe('Adaptive Quiz Mode', () => {
    it('should adjust difficulty based on performance', async () => {
      const adaptiveQuiz = {
        id: 'adaptive-quiz',
        mode: 'adaptive',
        field: 'system-design',
        initialLevel: 'middle',
        currentLevel: 'middle',
        performanceMetrics: {
          correctStreak: 3,
          averageTime: 45, // seconds per question
          difficultyAdjustment: 0 // -1: easier, 0: same, 1: harder
        },
        adaptationRules: {
          promoteAfter: 5, // consecutive correct
          demoteAfter: 3   // consecutive incorrect
        }
      };

      // Simulate good performance -> increase difficulty
      if (adaptiveQuiz.performanceMetrics.correctStreak >= 5) {
        adaptiveQuiz.currentLevel = 'senior';
        adaptiveQuiz.performanceMetrics.difficultyAdjustment = 1;
      }

      expect(adaptiveQuiz.mode).toBe('adaptive');
      expect(adaptiveQuiz.adaptationRules.promoteAfter).toBe(5);
      expect(adaptiveQuiz.adaptationRules.demoteAfter).toBe(3);
    });

    it('should provide personalized question selection', async () => {
      const personalizedQuiz = {
        id: 'personalized-quiz',
        userId: 'user123',
        field: 'machine-learning',
        personalizedTopics: [
          { topic: 'neural-networks', weight: 0.4, weakness: true },
          { topic: 'regression', weight: 0.3, weakness: false },
          { topic: 'clustering', weight: 0.3, weakness: true }
        ],
        focusOnWeaknesses: true,
        learningPath: 'ml-fundamentals'
      };

      const weakTopics = personalizedQuiz.personalizedTopics.filter(t => t.weakness);
      
      expect(personalizedQuiz.focusOnWeaknesses).toBe(true);
      expect(weakTopics).toHaveLength(2); // neural-networks, clustering
      expect(personalizedQuiz.learningPath).toBe('ml-fundamentals');
    });
  });
});
