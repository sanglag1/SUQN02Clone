import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AssessmentTrackingService } from '@/services/assessmentTrackingService';
import { Assessment, ActivityType } from '@prisma/client';

vi.mock('@/lib/prisma', () => {
  const prisma = {
    user: { findUnique: vi.fn() },
    userActivity: { findUnique: vi.fn() },
    jobRole: { findUnique: vi.fn() },
  } as any;
  return { default: prisma };
});

vi.mock('@/services/userActivityService', () => ({
  UserActivityService: {
    initializeUserActivity: vi.fn(),
    addActivity: vi.fn(),
    updateSkill: vi.fn(),
    updateLearningStats: vi.fn(),
    generateRecommendations: vi.fn(),
  },
}));

describe('AssessmentTrackingService', () => {
  const userId = 'db-user-1';
  const clerkId = 'clerk-user-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('trackAssessmentCompletion', () => {
    const mockAssessment: Assessment = {
      id: 'assessment-1',
      userId: clerkId,
      type: 'test',
      level: 'Junior',
      duration: 15,
      totalTime: 900,
      selectedCategory: null,
      history: null,
      realTimeScores: null,
      finalScores: { overall: 8.5, fundamental: 8, logic: 9, language: 8 },
      status: 'completed',
      overallFeedback: 'Good performance',
      jobRoleId: 'role-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should track test assessment completion successfully', async () => {
      const prisma = (await import('@/lib/prisma')).default as any;
      const { UserActivityService } = await import('@/services/userActivityService');

      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.userActivity.findUnique.mockResolvedValue({ id: 'activity-1', activities: [] });
      (UserActivityService.addActivity as any).mockResolvedValue(undefined);
      (UserActivityService.updateSkill as any).mockResolvedValue(undefined);
      (UserActivityService.updateLearningStats as any).mockResolvedValue(undefined);
      (UserActivityService.generateRecommendations as any).mockResolvedValue(undefined);

      await AssessmentTrackingService.trackAssessmentCompletion(userId, mockAssessment, { clerkId });

      expect(UserActivityService.addActivity).toHaveBeenCalledWith(userId, {
        type: 'test',
        score: 8.5,
        duration: 15,
        timestamp: expect.any(String),
        referenceId: 'assessment-1',
        skillScores: { fundamental: 8, logic: 9, language: 8, overall: 8.5 }
      });
    });

    it('should handle user not found in database', async () => {
      const prisma = (await import('@/lib/prisma')).default as any;
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(null); // clerkId lookup also fails

      await AssessmentTrackingService.trackAssessmentCompletion(userId, mockAssessment, { clerkId });

      // Should not throw error, just log and return
      expect(prisma.userActivity.findUnique).not.toHaveBeenCalled();
    });

    it('should handle database timeout gracefully', async () => {
      const prisma = (await import('@/lib/prisma')).default as any;
      prisma.user.findUnique.mockImplementation(() => new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database operation timed out')), 100);
      }));

      await AssessmentTrackingService.trackAssessmentCompletion(userId, mockAssessment, { clerkId });

      // Should not throw error, just log and return
      expect(prisma.userActivity.findUnique).not.toHaveBeenCalled();
    });

    it('should create UserActivity if it does not exist', async () => {
      const prisma = (await import('@/lib/prisma')).default as any;
      const { UserActivityService } = await import('@/services/userActivityService');

      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.userActivity.findUnique.mockResolvedValue(null);
      (UserActivityService.initializeUserActivity as any).mockResolvedValue({ id: 'new-activity' });
      (UserActivityService.addActivity as any).mockResolvedValue(undefined);

      await AssessmentTrackingService.trackAssessmentCompletion(userId, mockAssessment, { clerkId });

      expect(UserActivityService.initializeUserActivity).toHaveBeenCalledWith(userId);
    });

    it('should skip duplicate assessment tracking', async () => {
      const prisma = (await import('@/lib/prisma')).default as any;
      const { UserActivityService } = await import('@/services/userActivityService');

      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.userActivity.findUnique.mockResolvedValue({
        id: 'activity-1',
        activities: [{ referenceId: 'assessment-1' }]
      });

      await AssessmentTrackingService.trackAssessmentCompletion(userId, mockAssessment, { clerkId });

      expect(UserActivityService.addActivity).not.toHaveBeenCalled();
    });

    it('should update skills from assessment', async () => {
      const prisma = (await import('@/lib/prisma')).default as any;
      const { UserActivityService } = await import('@/services/userActivityService');

      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.userActivity.findUnique.mockResolvedValue({ id: 'activity-1', activities: [] });
      prisma.jobRole.findUnique.mockResolvedValue({ title: 'Frontend Developer', level: 'Junior' });
      (UserActivityService.addActivity as any).mockResolvedValue(undefined);
      (UserActivityService.updateSkill as any).mockResolvedValue(undefined);

      await AssessmentTrackingService.trackAssessmentCompletion(userId, mockAssessment, { clerkId });

      expect(UserActivityService.updateSkill).toHaveBeenCalledWith(userId, {
        name: 'Frontend Developer',
        score: 8.5,
        category: 'Junior',
        lastAssessed: expect.any(String)
      });
    });

    it('should handle EQ assessment type', async () => {
      const eqAssessment: Assessment = {
        ...mockAssessment,
        type: 'eq',
        finalScores: { overall: 7.5, emotionalAwareness: 8, conflictResolution: 7, communication: 7.5 }
      };

      const prisma = (await import('@/lib/prisma')).default as any;
      const { UserActivityService } = await import('@/services/userActivityService');

      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.userActivity.findUnique.mockResolvedValue({ id: 'activity-1', activities: [] });
      (UserActivityService.addActivity as any).mockResolvedValue(undefined);
      (UserActivityService.updateSkill as any).mockResolvedValue(undefined);

      await AssessmentTrackingService.trackAssessmentCompletion(userId, eqAssessment, { clerkId });

      expect(UserActivityService.addActivity).toHaveBeenCalledWith(userId, {
        type: 'eq',
        score: 7.5,
        duration: 15,
        timestamp: expect.any(String),
        referenceId: 'assessment-1',
        skillScores: { emotionalAwareness: 8, conflictResolution: 7, communication: 7.5, overall: 7.5 }
      });
    });

    it('should extract score from realTimeScores when finalScores not available', async () => {
      const assessmentWithRealTime: Assessment = {
        ...mockAssessment,
        finalScores: null,
        realTimeScores: { fundamental: 7, logic: 8, language: 7.5 }
      };

      const prisma = (await import('@/lib/prisma')).default as any;
      const { UserActivityService } = await import('@/services/userActivityService');

      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.userActivity.findUnique.mockResolvedValue({ id: 'activity-1', activities: [] });
      (UserActivityService.addActivity as any).mockResolvedValue(undefined);

      await AssessmentTrackingService.trackAssessmentCompletion(userId, assessmentWithRealTime, { clerkId });

      expect(UserActivityService.addActivity).toHaveBeenCalledWith(userId, {
        type: 'test',
        score: 7.5, // Average of 7, 8, 7.5
        duration: 15,
        timestamp: expect.any(String),
        referenceId: 'assessment-1',
        skillScores: { fundamental: 7, logic: 8, language: 7.5, overall: 7.5 }
      });
    });

    it('should handle assessment with no scores', async () => {
      const assessmentNoScores: Assessment = {
        ...mockAssessment,
        finalScores: null,
        realTimeScores: null
      };

      const prisma = (await import('@/lib/prisma')).default as any;
      const { UserActivityService } = await import('@/services/userActivityService');

      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.userActivity.findUnique.mockResolvedValue({ id: 'activity-1', activities: [] });
      (UserActivityService.addActivity as any).mockResolvedValue(undefined);

      await AssessmentTrackingService.trackAssessmentCompletion(userId, assessmentNoScores, { clerkId });

      expect(UserActivityService.addActivity).toHaveBeenCalledWith(userId, {
        type: 'test',
        score: 0,
        duration: 15,
        timestamp: expect.any(String),
        referenceId: 'assessment-1',
        skillScores: undefined
      });
    });

    it('should handle service errors gracefully', async () => {
      const prisma = (await import('@/lib/prisma')).default as any;
      const { UserActivityService } = await import('@/services/userActivityService');

      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.userActivity.findUnique.mockResolvedValue({ id: 'activity-1', activities: [] });
      (UserActivityService.addActivity as any).mockRejectedValue(new Error('Service error'));

      // Should not throw error, just log and continue
      await AssessmentTrackingService.trackAssessmentCompletion(userId, mockAssessment, { clerkId });
      
      // Verify that other services were still called despite the error
      expect(UserActivityService.updateSkill).toHaveBeenCalled();
      expect(UserActivityService.updateLearningStats).toHaveBeenCalled();
      expect(UserActivityService.generateRecommendations).toHaveBeenCalled();
    });
  });

  describe('score extraction', () => {
    it('should extract overall score from finalScores', () => {
      const assessment: Assessment = {
        id: 'test-1',
        userId: 'user-1',
        type: 'test',
        finalScores: { overall: 8.5, fundamental: 8, logic: 9, language: 8 },
      } as Assessment;

      // Access private method through reflection or test the public behavior
      const result = AssessmentTrackingService['extractScore'](assessment);
      expect(result).toBe(8.5);
    });

    it('should calculate average from finalScores when overall not available', () => {
      const assessment: Assessment = {
        id: 'test-1',
        userId: 'user-1',
        type: 'test',
        finalScores: { fundamental: 8, logic: 9, language: 7 },
      } as Assessment;

      const result = AssessmentTrackingService['extractScore'](assessment);
      expect(result).toBe(8); // (8 + 9 + 7) / 3 = 8
    });

    it('should fallback to realTimeScores when finalScores not available', () => {
      const assessment: Assessment = {
        id: 'test-1',
        userId: 'user-1',
        type: 'test',
        finalScores: null,
        realTimeScores: { fundamental: 7, logic: 8, language: 6 },
      } as Assessment;

      const result = AssessmentTrackingService['extractScore'](assessment);
      expect(result).toBe(7); // (7 + 8 + 6) / 3 = 7
    });
  });
});
