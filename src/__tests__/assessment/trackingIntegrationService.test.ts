import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TrackingIntegrationService } from '@/services/trackingIntegrationService';
import { Assessment, Interview, GoalStatus, ActivityType } from '@prisma/client';

vi.mock('@/services/userActivityService', () => ({
  UserActivityService: {
    trackInterviewActivity: vi.fn(),
    addActivity: vi.fn(),
    updateSkill: vi.fn(),
    updateLearningStats: vi.fn(),
    generateRecommendations: vi.fn(),
    updateGoalStatus: vi.fn(),
    getUserActivity: vi.fn(),
    initializeUserActivity: vi.fn(),
    getProgressReport: vi.fn(),
  },
}));

vi.mock('@/services/assessmentTrackingService', () => ({
  AssessmentTrackingService: {
    trackAssessmentCompletion: vi.fn(),
  },
}));

describe('TrackingIntegrationService', () => {
  const userId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('trackInterviewCompletion', () => {
    const mockInterview: Interview = {
      id: 'interview-1',
      userId,
      type: 'technical',
      status: 'completed',
      duration: 30,
      score: 8.5,
      feedback: 'Good performance',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should track interview completion successfully', async () => {
      const { UserActivityService } = await import('@/services/userActivityService');
      (UserActivityService.trackInterviewActivity as any).mockResolvedValue(undefined);
      (UserActivityService.updateLearningStats as any).mockResolvedValue(undefined);
      (UserActivityService.generateRecommendations as any).mockResolvedValue(undefined);

      await TrackingIntegrationService.trackInterviewCompletion(userId, mockInterview);

      expect(UserActivityService.trackInterviewActivity).toHaveBeenCalledWith(userId, 'interview-1');
      expect(UserActivityService.updateLearningStats).toHaveBeenCalledWith(userId);
      expect(UserActivityService.generateRecommendations).toHaveBeenCalledWith(userId);
    });

    it('should handle service errors gracefully', async () => {
      const { UserActivityService } = await import('@/services/userActivityService');
      (UserActivityService.trackInterviewActivity as any).mockRejectedValue(new Error('Service error'));

      // Should not throw error
      await TrackingIntegrationService.trackInterviewCompletion(userId, mockInterview);
    });
  });

  describe('trackQuizCompletion', () => {
    const mockQuestions = [
      { topics: ['React', 'JavaScript'] },
      { topics: ['React', 'State Management'] }
    ];

    it('should track quiz completion with correct score calculation', async () => {
      const { UserActivityService } = await import('@/services/userActivityService');
      (UserActivityService.addActivity as any).mockResolvedValue(undefined);
      (UserActivityService.updateSkill as any).mockResolvedValue(undefined);
      (UserActivityService.updateLearningStats as any).mockResolvedValue(undefined);

      await TrackingIntegrationService.trackQuizCompletion(userId, mockQuestions, 1, 300);

      // Score should be (1/2) * 10 = 5
      expect(UserActivityService.addActivity).toHaveBeenCalledWith(userId, {
        type: 'quiz',
        score: 5,
        duration: 300,
        timestamp: expect.any(String)
      });

      // Should update skills for unique topics: React, JavaScript, State Management
      expect(UserActivityService.updateSkill).toHaveBeenCalledTimes(3);
    });

    it('should handle perfect score', async () => {
      const { UserActivityService } = await import('@/services/userActivityService');
      (UserActivityService.addActivity as any).mockResolvedValue(undefined);

      await TrackingIntegrationService.trackQuizCompletion(userId, mockQuestions, 2, 180);

      expect(UserActivityService.addActivity).toHaveBeenCalledWith(userId, {
        type: 'quiz',
        score: 10, // (2/2) * 10 = 10
        duration: 180,
        timestamp: expect.any(String)
      });
    });

    it('should handle zero score', async () => {
      const { UserActivityService } = await import('@/services/userActivityService');
      (UserActivityService.addActivity as any).mockResolvedValue(undefined);

      await TrackingIntegrationService.trackQuizCompletion(userId, mockQuestions, 0, 600);

      expect(UserActivityService.addActivity).toHaveBeenCalledWith(userId, {
        type: 'quiz',
        score: 0, // (0/2) * 10 = 0
        duration: 600,
        timestamp: expect.any(String)
      });
    });
  });

  describe('trackQuizCompletionNew', () => {
    const mockQuizData = {
      quizId: 'quiz-1',
      field: 'Frontend',
      topic: 'React',
      level: 'Junior',
      score: 85,
      totalQuestions: 10,
      correctAnswers: 8,
      timeUsed: 300,
      retryCount: 1
    };

    it('should track new quiz completion with normalized score', async () => {
      const { UserActivityService } = await import('@/services/userActivityService');
      (UserActivityService.addActivity as any).mockResolvedValue(undefined);
      (UserActivityService.updateSkill as any).mockResolvedValue(undefined);
      (UserActivityService.updateLearningStats as any).mockResolvedValue(undefined);

      await TrackingIntegrationService.trackQuizCompletionNew(userId, mockQuizData);

      // Score should be normalized from 85 to 8.5 (rounded to 9)
      expect(UserActivityService.addActivity).toHaveBeenCalledWith(userId, {
        type: 'quiz',
        score: 9, // 85/10 rounded
        duration: 5, // 300 seconds / 60 = 5 minutes
        timestamp: expect.any(String)
      });

      expect(UserActivityService.updateSkill).toHaveBeenCalledWith(userId, {
        name: 'React',
        score: 85,
        lastAssessed: expect.any(String)
      });
    });

    it('should handle score already in 1-10 range', async () => {
      const { UserActivityService } = await import('@/services/userActivityService');
      (UserActivityService.addActivity as any).mockResolvedValue(undefined);

      const quizDataWithLowScore = { ...mockQuizData, score: 7 };
      await TrackingIntegrationService.trackQuizCompletionNew(userId, quizDataWithLowScore);

      expect(UserActivityService.addActivity).toHaveBeenCalledWith(userId, {
        type: 'quiz',
        score: 7, // Already in correct range
        duration: 5,
        timestamp: expect.any(String)
      });
    });

    it('should handle minimum duration of 1 minute', async () => {
      const { UserActivityService } = await import('@/services/userActivityService');
      (UserActivityService.addActivity as any).mockResolvedValue(undefined);

      const quizDataWithShortTime = { ...mockQuizData, timeUsed: 30 };
      await TrackingIntegrationService.trackQuizCompletionNew(userId, quizDataWithShortTime);

      expect(UserActivityService.addActivity).toHaveBeenCalledWith(userId, {
        type: 'quiz',
        score: 9,
        duration: 1, // Minimum 1 minute
        timestamp: expect.any(String)
      });
    });
  });

  describe('trackPracticeSession', () => {
    it('should track practice session with performance score', async () => {
      const { UserActivityService } = await import('@/services/userActivityService');
      (UserActivityService.addActivity as any).mockResolvedValue(undefined);
      (UserActivityService.updateSkill as any).mockResolvedValue(undefined);
      (UserActivityService.updateLearningStats as any).mockResolvedValue(undefined);

      await TrackingIntegrationService.trackPracticeSession(userId, 'React', 45, 8.5);

      expect(UserActivityService.addActivity).toHaveBeenCalledWith(userId, {
        type: 'practice',
        score: 8.5,
        duration: 45,
        timestamp: expect.any(String)
      });

      expect(UserActivityService.updateSkill).toHaveBeenCalledWith(userId, {
        name: 'React',
        score: 8.5,
        lastAssessed: expect.any(String)
      });
    });

    it('should track practice session without performance score', async () => {
      const { UserActivityService } = await import('@/services/userActivityService');
      (UserActivityService.addActivity as any).mockResolvedValue(undefined);
      (UserActivityService.updateLearningStats as any).mockResolvedValue(undefined);

      await TrackingIntegrationService.trackPracticeSession(userId, 'JavaScript', 30);

      expect(UserActivityService.addActivity).toHaveBeenCalledWith(userId, {
        type: 'practice',
        score: undefined,
        duration: 30,
        timestamp: expect.any(String)
      });

      // Should not update skill without performance score
      expect(UserActivityService.updateSkill).not.toHaveBeenCalled();
    });
  });

  describe('trackGoalProgress', () => {
    it('should track goal completion and generate recommendations', async () => {
      const { UserActivityService } = await import('@/services/userActivityService');
      (UserActivityService.updateGoalStatus as any).mockResolvedValue(undefined);
      (UserActivityService.generateRecommendations as any).mockResolvedValue(undefined);

      await TrackingIntegrationService.trackGoalProgress(userId, 'goal-1', 'completed');

      expect(UserActivityService.updateGoalStatus).toHaveBeenCalledWith(userId, 'goal-1', 'completed');
      expect(UserActivityService.generateRecommendations).toHaveBeenCalledWith(userId);
    });

    it('should track goal progress without generating recommendations for non-completed status', async () => {
      const { UserActivityService } = await import('@/services/userActivityService');
      (UserActivityService.updateGoalStatus as any).mockResolvedValue(undefined);

      await TrackingIntegrationService.trackGoalProgress(userId, 'goal-1', 'in_progress');

      expect(UserActivityService.updateGoalStatus).toHaveBeenCalledWith(userId, 'goal-1', 'in_progress');
      expect(UserActivityService.generateRecommendations).not.toHaveBeenCalled();
    });
  });

  describe('trackAssessmentCompletion', () => {
    const mockAssessment: Assessment = {
      id: 'assessment-1',
      userId,
      type: 'test',
      level: 'Junior',
      duration: 15,
      totalTime: 900,
      selectedCategory: null,
      history: null,
      realTimeScores: null,
      finalScores: { overall: 8.5 },
      status: 'completed',
      overallFeedback: 'Good performance',
      jobRoleId: 'role-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should track assessment completion successfully', async () => {
      const { AssessmentTrackingService } = await import('@/services/assessmentTrackingService');
      (AssessmentTrackingService.trackAssessmentCompletion as any).mockResolvedValue(undefined);

      await TrackingIntegrationService.trackAssessmentCompletion(userId, mockAssessment, { clerkId: 'clerk-123' });

      expect(AssessmentTrackingService.trackAssessmentCompletion).toHaveBeenCalledWith(
        userId,
        mockAssessment
      );
    });

    it('should handle invalid userId gracefully', async () => {
      const { AssessmentTrackingService } = await import('@/services/assessmentTrackingService');

      await TrackingIntegrationService.trackAssessmentCompletion('', mockAssessment);

      expect(AssessmentTrackingService.trackAssessmentCompletion).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      const { AssessmentTrackingService } = await import('@/services/assessmentTrackingService');
      (AssessmentTrackingService.trackAssessmentCompletion as any).mockRejectedValue(new Error('Service error'));

      // Should not throw error
      await TrackingIntegrationService.trackAssessmentCompletion(userId, mockAssessment);
    });
  });

  describe('getProgressOverview', () => {
    it('should return existing user activity progress', async () => {
      const { UserActivityService } = await import('@/services/userActivityService');
      const mockUserActivity = {
        id: 'activity-1',
        userId,
        activities: [{ type: 'interview', score: 8 }]
      };
      const mockProgressReport = {
        stats: { totalInterviews: 1, averageScore: 8 },
        skillProgress: [],
        currentFocus: ['Continue practicing'],
        nextMilestones: [],
        recommendations: ['Keep up the good work']
      };

      (UserActivityService.getUserActivity as any).mockResolvedValue(mockUserActivity);
      (UserActivityService.getProgressReport as any).mockResolvedValue(mockProgressReport);

      const result = await TrackingIntegrationService.getProgressOverview(userId);

      expect(result).toEqual(mockProgressReport);
    });

    it('should initialize new user activity if none exists', async () => {
      const { UserActivityService } = await import('@/services/userActivityService');
      const mockNewActivity = {
        id: 'new-activity-1',
        userId,
        activities: []
      };

      (UserActivityService.getUserActivity as any).mockResolvedValue(null);
      (UserActivityService.initializeUserActivity as any).mockResolvedValue(mockNewActivity);
      (UserActivityService.getProgressReport as any).mockResolvedValue({
        stats: { totalInterviews: 0, averageScore: 0 },
        skillProgress: [],
        currentFocus: ['Start your first interview'],
        nextMilestones: [],
        recommendations: ['Begin with practice interviews']
      });

      const result = await TrackingIntegrationService.getProgressOverview(userId);

      expect(UserActivityService.initializeUserActivity).toHaveBeenCalledWith(userId);
    });

    it('should return default progress for new users with no activities', async () => {
      const { UserActivityService } = await import('@/services/userActivityService');
      const mockUserActivity = {
        id: 'activity-1',
        userId,
        activities: null
      };

      (UserActivityService.getUserActivity as any).mockResolvedValue(mockUserActivity);

      const result = await TrackingIntegrationService.getProgressOverview(userId);

      expect(result.stats.totalInterviews).toBe(0);
      expect(result.stats.averageScore).toBe(0.0);
      expect(result.currentFocus).toContain('Complete your first interview practice');
    });

    it('should handle service errors and return default progress', async () => {
      const { UserActivityService } = await import('@/services/userActivityService');
      (UserActivityService.getUserActivity as any).mockRejectedValue(new Error('Service error'));

      const result = await TrackingIntegrationService.getProgressOverview(userId);

      expect(result.stats.totalInterviews).toBe(0);
      expect(result.stats.averageScore).toBe(0.0);
      expect(result.currentFocus).toContain('Complete your first interview practice');
    });
  });
});
