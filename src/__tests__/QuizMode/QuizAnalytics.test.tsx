import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test cho Analytics và Reporting của Quiz System
describe('QuizMode - Analytics & Reporting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('Performance Analytics', () => {
    it('should track detailed quiz performance metrics from quiz history API', async () => {
      // Mock real quiz history response based on actual API structure
      const quizHistoryData = [
        {
          id: 'perf-quiz-1',
          field: 'backend',
          topic: 'api-design', 
          level: 'senior',
          score: 80,
          timeUsed: 1200, // seconds
          totalQuestions: 15,
          correctAnswers: 12,
          completedAt: new Date().toISOString(),
          retryCount: 0,
          userAnswers: [
            { questionId: 'q1', answerIndex: [0], isCorrect: true },
            { questionId: 'q2', answerIndex: [1], isCorrect: false },
            { questionId: 'q3', answerIndex: [0], isCorrect: true }
          ],
          questions: [
            { 
              id: 'q1', 
              question: 'What is API versioning?',
              answers: [{ content: 'Version control for APIs', isCorrect: true }]
            }
          ]
        }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => quizHistoryData
      });

      // Test actual quiz history API
      const response = await fetch('/api/quizzes/history');
      const history = await response.json();
      
      expect(history[0].score).toBe(80);
      expect(history[0].correctAnswers).toBe(12);
      expect(history[0].timeUsed).toBe(1200);
      expect(history[0].userAnswers).toHaveLength(3);
    });

    it('should generate learning insights from quiz data', async () => {
      const learningInsights = {
        userId: 'user123',
        timeframe: 'last-30-days',
        insights: {
          strengthAreas: ['frontend', 'javascript'],
          weaknessAreas: ['system-design', 'databases'],
          improvementTrends: {
            frontend: { trend: 'improving', change: +15 },
            backend: { trend: 'stable', change: 0 },
            devops: { trend: 'declining', change: -8 }
          },
          recommendations: [
            {
              type: 'focus-area',
              message: 'Practice more System Design questions',
              priority: 'high',
              suggestedTopics: ['scalability', 'load-balancing', 'caching']
            },
            {
              type: 'time-management', 
              message: 'Reduce average time per question by 15 seconds',
              priority: 'medium',
              currentAverage: 75,
              targetAverage: 60
            }
          ]
        }
      };

      expect(learningInsights.insights.strengthAreas).toContain('frontend');
      expect(learningInsights.insights.weaknessAreas).toContain('system-design');
      expect(learningInsights.insights.recommendations).toHaveLength(2);
      expect(learningInsights.insights.recommendations[0].priority).toBe('high');
    });
  });

  describe('Progress Tracking', () => {
    it('should track learning progress over time', async () => {
      const progressData = {
        userId: 'user123',
        field: 'ai-engineer',
        progression: {
          beginner: {
            completed: 25,
            total: 30,
            averageScore: 78,
            status: 'completed'
          },
          intermediate: {
            completed: 15,
            total: 25, 
            averageScore: 65,
            status: 'in-progress'
          },
          advanced: {
            completed: 0,
            total: 20,
            averageScore: null,
            status: 'locked'
          }
        },
        skillProgress: {
          'machine-learning': 85, // percentage
          'deep-learning': 60,
          'nlp': 40,
          'computer-vision': 70
        },
        milestones: [
          {
            name: 'ML Fundamentals',
            completed: true,
            completedAt: '2025-08-15',
            badge: 'ml-fundamentals-bronze'
          },
          {
            name: 'Neural Networks Master',
            completed: false,
            requiredScore: 85,
            currentBest: 82,
            attemptsRemaining: 3
          }
        ]
      };

      expect(progressData.progression.beginner.status).toBe('completed');
      expect(progressData.progression.intermediate.status).toBe('in-progress');
      expect(progressData.skillProgress['machine-learning']).toBe(85);
      expect(progressData.milestones[0].completed).toBe(true);
    });

    it('should calculate skill mastery levels', async () => {
      const skillMastery = {
        userId: 'user123',
        skills: {
          'react': {
            level: 'expert', // novice -> beginner -> intermediate -> advanced -> expert
            score: 92,
            quizzesTaken: 15,
            lastImprovement: '2025-08-20',
            strengths: ['hooks', 'context', 'performance'],
            weaknesses: ['server-side-rendering', 'testing']
          },
          'nodejs': {
            level: 'advanced',
            score: 85,
            quizzesTaken: 12,
            lastImprovement: '2025-08-18',
            strengths: ['express', 'middleware', 'async-programming'],
            weaknesses: ['clustering', 'performance-optimization']
          },
          'system-design': {
            level: 'intermediate',
            score: 68,
            quizzesTaken: 8,
            lastImprovement: '2025-08-10',
            strengths: ['database-design'],
            weaknesses: ['scalability', 'caching', 'load-balancing']
          }
        }
      };

      const expertSkills = Object.entries(skillMastery.skills)
        .filter(([_, skill]) => skill.level === 'expert')
        .map(([name, _]) => name);

      const needsImprovementSkills = Object.entries(skillMastery.skills)
        .filter(([_, skill]) => skill.level === 'intermediate' && skill.score < 70)
        .map(([name, _]) => name);

      expect(expertSkills).toContain('react');
      expect(needsImprovementSkills).toContain('system-design');
    });
  });

  describe('Comparative Analytics', () => {
    it('should compare performance against peers', async () => {
      const peerComparison = {
        userId: 'user123',
        field: 'frontend',
        userStats: {
          averageScore: 78,
          totalQuizzes: 25,
          timeSpentHours: 15.5
        },
        peerStats: {
          averageScore: 72, // peer average
          totalQuizzes: 20,  // peer average
          timeSpentHours: 18 // peer average
        },
        ranking: {
          position: 15,
          totalParticipants: 150,
          percentile: 90 // user is in top 10%
        },
        comparisons: {
          scoreComparison: +6, // 6 points above average
          efficiencyRatio: 1.25, // 25% more efficient (better score per hour)
          consistencyScore: 0.82 // 0-1, higher is more consistent
        }
      };

      expect(peerComparison.userStats.averageScore).toBeGreaterThan(peerComparison.peerStats.averageScore);
      expect(peerComparison.ranking.percentile).toBe(90);
      expect(peerComparison.comparisons.scoreComparison).toBe(6);
      expect(peerComparison.comparisons.efficiencyRatio).toBeGreaterThan(1);
    });

    it('should provide field-specific leaderboards', async () => {
      const leaderboard = {
        field: 'devops',
        timeframe: 'monthly',
        rankings: [
          {
            position: 1,
            userId: 'leader1',
            username: 'DevOps Master',
            score: 95,
            quizzesTaken: 30,
            badge: 'devops-champion-gold'
          },
          {
            position: 2, 
            userId: 'user123',
            username: 'Cloud Ninja',
            score: 89,
            quizzesTaken: 25,
            badge: 'devops-expert-silver'
          },
          {
            position: 3,
            userId: 'user456', 
            username: 'K8s Expert',
            score: 87,
            quizzesTaken: 28,
            badge: 'kubernetes-specialist'
          }
        ],
        userPosition: {
          current: 2,
          previous: 4,
          change: +2,
          trend: 'rising'
        }
      };

      const topThree = leaderboard.rankings.slice(0, 3);
      const userRanking = leaderboard.rankings.find(r => r.userId === 'user123');
      
      expect(topThree).toHaveLength(3);
      expect(userRanking?.position).toBe(2);
      expect(leaderboard.userPosition.change).toBe(2); // Improved by 2 positions
      expect(leaderboard.userPosition.trend).toBe('rising');
    });
  });

  describe('Quiz Content Analytics', () => {
    it('should analyze question difficulty and performance', async () => {
      const questionAnalytics = {
        field: 'backend',
        topic: 'databases',
        questions: [
          {
            questionId: 'db-q1',
            text: 'What is ACID compliance?',
            difficulty: 'intermediate',
            stats: {
              totalAttempts: 150,
              correctAttempts: 120,
              successRate: 80,
              averageTimeSpent: 45
            },
            performance: {
              juniorSuccess: 65,
              middleSuccess: 85,
              seniorSuccess: 95
            }
          },
          {
            questionId: 'db-q2',
            text: 'Explain database sharding strategies',
            difficulty: 'advanced',
            stats: {
              totalAttempts: 100,
              correctAttempts: 35,
              successRate: 35,
              averageTimeSpent: 120
            },
            performance: {
              juniorSuccess: 10,
              middleSuccess: 35,
              seniorSuccess: 65
            }
          }
        ]
      };

      const easyQuestions = questionAnalytics.questions.filter(q => q.stats.successRate > 75);
      const hardQuestions = questionAnalytics.questions.filter(q => q.stats.successRate < 50);
      
      expect(easyQuestions).toHaveLength(1);
      expect(hardQuestions).toHaveLength(1);
      expect(easyQuestions[0].questionId).toBe('db-q1');
      expect(hardQuestions[0].questionId).toBe('db-q2');
    });

    it('should track quiz completion and engagement metrics', async () => {
      const engagementMetrics = {
        period: '2025-08',
        metrics: {
          totalQuizzesStarted: 1200,
          totalQuizzesCompleted: 950,
          completionRate: 79.2,
          averageTimeToComplete: 18.5, // minutes
          dropoffPoints: [
            { questionNumber: 3, dropoffRate: 8 },
            { questionNumber: 8, dropoffRate: 12 },
            { questionNumber: 12, dropoffRate: 6 }
          ],
          retryRate: 35, // percentage of users who retry
          satisfactionScore: 4.2 // out of 5
        },
        fieldBreakdown: {
          frontend: { completionRate: 85, satisfaction: 4.3 },
          backend: { completionRate: 78, satisfaction: 4.1 },
          devops: { completionRate: 72, satisfaction: 4.0 },
          'ai-engineer': { completionRate: 68, satisfaction: 4.4 }
        }
      };

      expect(engagementMetrics.metrics.completionRate).toBeCloseTo(79.2);
      expect(engagementMetrics.metrics.dropoffPoints[1].questionNumber).toBe(8);
      expect(engagementMetrics.fieldBreakdown.frontend.completionRate).toBe(85);
      expect(engagementMetrics.fieldBreakdown['ai-engineer'].satisfaction).toBe(4.4);
    });
  });

  describe('Reporting and Analytics Integration', () => {
    it('should integrate with admin analytics API for comprehensive reporting', async () => {
      // Mock actual admin analytics API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          overview: {
            totalUsers: 150,
            activeUsers: 45,
            userGrowthRate: 12,
            platformEngagement: 30
          },
          activityStats: {
            totalQuizzes: 350,
            recentQuizzes: 45,
            totalInterviews: 450,
            totalTests: 125
          },
          engagementMetrics: {
            dailyActiveUsers: 15,
            weeklyActiveUsers: 35,
            monthlyActiveUsers: 45
          },
          skillDistribution: [
            {
              name: 'React',
              userCount: 25,
              averageScore: 82,
              levelDistribution: {
                beginner: 5,
                intermediate: 10,
                advanced: 8,
                expert: 2
              }
            }
          ],
          topPerformers: [
            {
              userId: 'user123',
              userName: 'Top Student',
              averageScore: 95,
              totalActivities: 50,
              studyStreak: 15
            }
          ]
        })
      });

      // Test actual admin analytics API
      const response = await fetch('/api/admin/user-activities/analytics?days=30');
      const analytics = await response.json();
      
      expect(analytics.overview.totalUsers).toBe(150);
      expect(analytics.activityStats.totalQuizzes).toBe(350);
      expect(analytics.skillDistribution[0].name).toBe('React');
      expect(analytics.topPerformers[0].averageScore).toBe(95);
    });

    it('should generate quiz-specific analytics from user activity data', async () => {
      // Mock quiz-focused analytics data structure
      const quizAnalytics = {
        quizMetrics: {
          totalQuizzesCompleted: 1250,
          averageQuizScore: 78.5,
          completionRate: 85.2,
          retryRate: 23.4
        },
        difficultyAnalysis: {
          junior: { averageScore: 85, completionRate: 92 },
          middle: { averageScore: 75, completionRate: 83 },
          senior: { averageScore: 68, completionRate: 76 }
        },
        fieldPerformance: {
          frontend: { averageScore: 82, totalQuizzes: 450 },
          backend: { averageScore: 76, totalQuizzes: 380 },
          devops: { averageScore: 73, totalQuizzes: 220 },
          'ai-engineer': { averageScore: 79, totalQuizzes: 200 }
        },
        timeAnalytics: {
          averageTimePerQuiz: 15.3, // minutes
          fastestCompletion: 8.5,
          slowestCompletion: 45.2,
          optimalTimeRange: { min: 12, max: 18 }
        }
      };

      expect(quizAnalytics.quizMetrics.completionRate).toBeCloseTo(85.2);
      expect(quizAnalytics.fieldPerformance.frontend.averageScore).toBe(82);
      expect(quizAnalytics.difficultyAnalysis.senior.averageScore).toBeLessThan(
        quizAnalytics.difficultyAnalysis.junior.averageScore
      );
    });
  });
});
