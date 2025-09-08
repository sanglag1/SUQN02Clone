import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateInterviewEvaluation } from '@/services/evaluationService';
import { ChatMessage } from '@/services/openaiService';

vi.mock('@/services/openaiService', () => ({
  callOpenAI: vi.fn(),
}));

describe('EvaluationService', () => {
  const mockConversation: ChatMessage[] = [
    { role: 'user', content: 'What is React?' },
    { role: 'assistant', content: 'React is a JavaScript library for building user interfaces.' },
    { role: 'user', content: 'How does React handle state?' },
    { role: 'assistant', content: 'React uses useState hook for functional components and this.state for class components.' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateInterviewEvaluation', () => {
    it('should generate evaluation for Frontend position', async () => {
      const { callOpenAI } = await import('@/services/openaiService');
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              technicalScore: 8,
              communicationScore: 7,
              problemSolvingScore: 8,
              cultureFitScore: 7,
              overallRating: 7.5,
              technicalStrengths: ['Good React knowledge', 'Clear explanations'],
              technicalWeaknesses: ['Could improve on advanced concepts'],
              recommendations: ['Study React patterns', 'Practice more'],
              hiringRecommendation: 'hire',
              detailedFeedback: {
                technical: 'Strong fundamentals in React',
                softSkills: 'Good communication skills',
                experience: 'Shows practical knowledge',
                potential: 'High potential for growth'
              },
              salary_range: {
                min: 12000000,
                max: 45000000,
                currency: 'VND'
              },
              levelAssessment: {
                currentLevel: 'Junior',
                readinessForNextLevel: false,
                gapAnalysis: ['Advanced React patterns', 'State management']
              }
            })
          }
        }]
      };
      (callOpenAI as any).mockResolvedValue(mockResponse);

      const result = await generateInterviewEvaluation(mockConversation, 'Frontend', 'Junior', 'en-US');

      expect(result.technicalScore).toBe(8);
      expect(result.communicationScore).toBe(7);
      expect(result.overallRating).toBe(8); // Service rounds the score
      expect(result.hiringRecommendation).toBe('hire');
      expect(result.salary_range.currency).toBe('VND');
      expect(result.levelAssessment.currentLevel).toBe('Junior');
    });

    it('should generate evaluation for Backend position', async () => {
      const { callOpenAI } = await import('@/services/openaiService');
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              technicalScore: 9,
              communicationScore: 8,
              problemSolvingScore: 9,
              cultureFitScore: 8,
              overallRating: 8.5,
              technicalStrengths: ['Strong backend knowledge', 'System design skills'],
              technicalWeaknesses: ['Could improve on DevOps'],
              recommendations: ['Learn more about cloud services'],
              hiringRecommendation: 'strong_hire',
              detailedFeedback: {
                technical: 'Excellent backend development skills',
                softSkills: 'Strong analytical thinking',
                experience: 'Deep understanding of system architecture',
                potential: 'Ready for senior level'
              },
              salary_range: {
                min: 15000000,
                max: 50000000,
                currency: 'VND'
              },
              levelAssessment: {
                currentLevel: 'Mid',
                readinessForNextLevel: true,
                gapAnalysis: ['DevOps practices', 'Cloud architecture']
              }
            })
          }
        }]
      };
      (callOpenAI as any).mockResolvedValue(mockResponse);

      const result = await generateInterviewEvaluation(mockConversation, 'Backend', 'Mid', 'en-US');

      expect(result.technicalScore).toBe(9);
      expect(result.overallRating).toBe(9); // Service rounds the score
      expect(result.hiringRecommendation).toBe('strong_hire');
      expect(result.levelAssessment.readinessForNextLevel).toBe(true);
    });

    it('should handle Vietnamese language evaluation', async () => {
      const { callOpenAI } = await import('@/services/openaiService');
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              technicalScore: 7,
              communicationScore: 8,
              problemSolvingScore: 7,
              cultureFitScore: 8,
              overallRating: 7.5,
              technicalStrengths: ['Kiến thức cơ bản tốt', 'Giải thích rõ ràng'],
              technicalWeaknesses: ['Cần cải thiện kỹ năng nâng cao'],
              recommendations: ['Học thêm về React patterns', 'Thực hành nhiều hơn'],
              hiringRecommendation: 'consider',
              detailedFeedback: {
                technical: 'Có kiến thức cơ bản tốt về React',
                softSkills: 'Kỹ năng giao tiếp tốt',
                experience: 'Có kinh nghiệm thực tế',
                potential: 'Có tiềm năng phát triển'
              },
              salary_range: {
                min: 12000000,
                max: 45000000,
                currency: 'VND'
              },
              levelAssessment: {
                currentLevel: 'Junior',
                readinessForNextLevel: false,
                gapAnalysis: ['React patterns nâng cao', 'State management']
              }
            })
          }
        }]
      };
      (callOpenAI as any).mockResolvedValue(mockResponse);

      const result = await generateInterviewEvaluation(mockConversation, 'Frontend', 'Junior', 'vi-VN');

      expect(result.technicalStrengths).toContain('Kiến thức cơ bản tốt');
      expect(result.detailedFeedback.technical).toContain('Có kiến thức cơ bản tốt');
    });

    it('should handle invalid JSON response and return default evaluation', async () => {
      const { callOpenAI } = await import('@/services/openaiService');
      (callOpenAI as any).mockResolvedValue({
        choices: [{
          message: {
            content: 'This is not valid JSON'
          }
        }]
      });

      const result = await generateInterviewEvaluation(mockConversation, 'Frontend', 'Junior', 'en-US');

      expect(result.technicalScore).toBe(6); // Default benchmark for Junior Frontend
      expect(result.hiringRecommendation).toBe('consider');
      expect(result.detailedFeedback.technical).toContain('basic understanding');
    });

    it('should handle missing fields in JSON response', async () => {
      const { callOpenAI } = await import('@/services/openaiService');
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              technicalScore: 8,
              // Missing other required fields
            })
          }
        }]
      };
      (callOpenAI as any).mockResolvedValue(mockResponse);

      const result = await generateInterviewEvaluation(mockConversation, 'Frontend', 'Junior', 'en-US');

      expect(result.technicalScore).toBe(8);
      expect(result.communicationScore).toBe(5); // Default value
      expect(result.problemSolvingScore).toBe(5); // Default value
      expect(result.cultureFitScore).toBe(5); // Default value
      expect(result.overallRating).toBe(5); // Default value
      expect(result.hiringRecommendation).toBe('consider'); // Default value
    });

    it('should handle invalid score values', async () => {
      const { callOpenAI } = await import('@/services/openaiService');
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              technicalScore: 15, // Invalid score > 10
              communicationScore: -1, // Invalid score < 1
              problemSolvingScore: 'invalid', // Invalid type
              cultureFitScore: 8,
              overallRating: 8,
              technicalStrengths: ['Good knowledge'],
              technicalWeaknesses: ['Needs improvement'],
              recommendations: ['Study more'],
              hiringRecommendation: 'hire',
              detailedFeedback: {
                technical: 'Good technical skills',
                softSkills: 'Good communication',
                experience: 'Some experience',
                potential: 'Good potential'
              },
              salary_range: {
                min: 12000000,
                max: 45000000,
                currency: 'VND'
              },
              levelAssessment: {
                currentLevel: 'Junior',
                readinessForNextLevel: false,
                gapAnalysis: ['Advanced concepts']
              }
            })
          }
        }]
      };
      (callOpenAI as any).mockResolvedValue(mockResponse);

      const result = await generateInterviewEvaluation(mockConversation, 'Frontend', 'Junior', 'en-US');

      expect(result.technicalScore).toBe(5); // Default value for invalid score
      expect(result.communicationScore).toBe(5); // Default value for invalid score
      expect(result.problemSolvingScore).toBe(5); // Default value for invalid score
      expect(result.cultureFitScore).toBe(8); // Valid score remains
    });

    it('should handle invalid hiring recommendation', async () => {
      const { callOpenAI } = await import('@/services/openaiService');
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              technicalScore: 8,
              communicationScore: 7,
              problemSolvingScore: 8,
              cultureFitScore: 7,
              overallRating: 7.5,
              technicalStrengths: ['Good knowledge'],
              technicalWeaknesses: ['Needs improvement'],
              recommendations: ['Study more'],
              hiringRecommendation: 'invalid_recommendation', // Invalid value
              detailedFeedback: {
                technical: 'Good technical skills',
                softSkills: 'Good communication',
                experience: 'Some experience',
                potential: 'Good potential'
              },
              salary_range: {
                min: 12000000,
                max: 45000000,
                currency: 'VND'
              },
              levelAssessment: {
                currentLevel: 'Junior',
                readinessForNextLevel: false,
                gapAnalysis: ['Advanced concepts']
              }
            })
          }
        }]
      };
      (callOpenAI as any).mockResolvedValue(mockResponse);

      const result = await generateInterviewEvaluation(mockConversation, 'Frontend', 'Junior', 'en-US');

      expect(result.hiringRecommendation).toBe('consider'); // Default value for invalid recommendation
    });

    it('should handle API error and return default evaluation', async () => {
      const { callOpenAI } = await import('@/services/openaiService');
      (callOpenAI as any).mockRejectedValue(new Error('API Error'));

      const result = await generateInterviewEvaluation(mockConversation, 'Frontend', 'Junior', 'en-US');

      expect(result.technicalScore).toBe(6); // Default benchmark for Junior Frontend
      expect(result.hiringRecommendation).toBe('consider');
      expect(result.detailedFeedback.technical).toContain('basic understanding');
    });

    it('should handle empty conversation', async () => {
      const { callOpenAI } = await import('@/services/openaiService');
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              technicalScore: 5,
              communicationScore: 5,
              problemSolvingScore: 5,
              cultureFitScore: 5,
              overallRating: 5,
              technicalStrengths: ['Limited information'],
              technicalWeaknesses: ['Need more data'],
              recommendations: ['Conduct more interviews'],
              hiringRecommendation: 'consider',
              detailedFeedback: {
                technical: 'Limited technical assessment',
                softSkills: 'Limited communication assessment',
                experience: 'Limited experience assessment',
                potential: 'Limited potential assessment'
              },
              salary_range: {
                min: 12000000,
                max: 45000000,
                currency: 'VND'
              },
              levelAssessment: {
                currentLevel: 'Junior',
                readinessForNextLevel: false,
                gapAnalysis: ['Need more assessment']
              }
            })
          }
        }]
      };
      (callOpenAI as any).mockResolvedValue(mockResponse);

      const result = await generateInterviewEvaluation([], 'Frontend', 'Junior', 'en-US');

      expect(result.overallRating).toBe(5);
      expect(result.hiringRecommendation).toBe('consider');
    });

    it('should handle Full Stack position evaluation', async () => {
      const { callOpenAI } = await import('@/services/openaiService');
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              technicalScore: 8,
              communicationScore: 8,
              problemSolvingScore: 8,
              cultureFitScore: 8,
              overallRating: 8,
              technicalStrengths: ['Full stack knowledge', 'Versatile skills'],
              technicalWeaknesses: ['Could specialize more'],
              recommendations: ['Focus on specific areas'],
              hiringRecommendation: 'hire',
              detailedFeedback: {
                technical: 'Good full stack capabilities',
                softSkills: 'Versatile and adaptable',
                experience: 'Cross-functional experience',
                potential: 'Good leadership potential'
              },
              salary_range: {
                min: 18000000,
                max: 55000000,
                currency: 'VND'
              },
              levelAssessment: {
                currentLevel: 'Mid',
                readinessForNextLevel: true,
                gapAnalysis: ['Specialization', 'Architecture patterns']
              }
            })
          }
        }]
      };
      (callOpenAI as any).mockResolvedValue(mockResponse);

      const result = await generateInterviewEvaluation(mockConversation, 'Full Stack', 'Mid', 'en-US');

      expect(result.overallRating).toBe(8);
      expect(result.salary_range.min).toBe(18000000);
      expect(result.salary_range.max).toBe(55000000);
      expect(result.levelAssessment.readinessForNextLevel).toBe(true);
    });

    it('should handle Senior level evaluation', async () => {
      const { callOpenAI } = await import('@/services/openaiService');
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              technicalScore: 9,
              communicationScore: 9,
              problemSolvingScore: 9,
              cultureFitScore: 9,
              overallRating: 9,
              technicalStrengths: ['Expert knowledge', 'Leadership skills'],
              technicalWeaknesses: ['Could mentor more'],
              recommendations: ['Take on leadership roles'],
              hiringRecommendation: 'strong_hire',
              detailedFeedback: {
                technical: 'Expert level technical skills',
                softSkills: 'Excellent leadership and communication',
                experience: 'Extensive practical experience',
                potential: 'Ready for lead positions'
              },
              salary_range: {
                min: 45000000,
                max: 71500000,
                currency: 'VND'
              },
              levelAssessment: {
                currentLevel: 'Senior',
                readinessForNextLevel: true,
                gapAnalysis: ['Team leadership', 'Strategic thinking']
              }
            })
          }
        }]
      };
      (callOpenAI as any).mockResolvedValue(mockResponse);

      const result = await generateInterviewEvaluation(mockConversation, 'Frontend', 'Senior', 'en-US');

      expect(result.overallRating).toBe(9);
      expect(result.hiringRecommendation).toBe('strong_hire');
      expect(result.salary_range.min).toBe(45000000); // Senior level salary
      expect(result.levelAssessment.currentLevel).toBe('Senior');
    });
  });
});
