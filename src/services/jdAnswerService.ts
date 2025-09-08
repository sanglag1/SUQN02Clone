import { prisma } from '@/lib/prisma';

export interface JdAnswerData {
  userId: string;
  jdQuestionSetId: string;
  questionIndex: number;
  questionText: string;
  userAnswer: string;
  feedback?: string;
  scores?: Record<string, number>;
  overallScore?: number;
  strengths?: string[];
  improvements?: string[];
  skillAssessment?: Record<string, unknown>;
  timeSpent?: number;
}

export interface AnalysisResult {
  feedback: string;
  detailedScores: Record<string, number>;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  skillAssessment?: Record<string, unknown>;
}

export class JdAnswerService {
  // Save answer to database
  static async saveAnswer(data: JdAnswerData) {
    try {
      const answer = await prisma.jdAnswers.create({
        data: {
          userId: data.userId,
          jdQuestionSetId: data.jdQuestionSetId,
          questionIndex: data.questionIndex,
          questionText: data.questionText,
          userAnswer: data.userAnswer,
          feedback: data.feedback,
          scores: data.scores,
          overallScore: data.overallScore,
          strengths: data.strengths || [],
          improvements: data.improvements || [],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(data.skillAssessment && { skillAssessment: data.skillAssessment as any }),
          timeSpent: data.timeSpent,
        },
      });

      return answer;
    } catch (error) {
      console.error('Error saving JD answer:', error);
      throw new Error('Failed to save answer');
    }
  }

  // Update answer with analysis results
  static async updateAnswerWithAnalysis(
    answerId: string,
    analysisResult: AnalysisResult
  ) {
    try {
      const updatedAnswer = await prisma.jdAnswers.update({
        where: { id: answerId },
        data: {
          feedback: analysisResult.feedback,
          scores: analysisResult.detailedScores,
          overallScore: analysisResult.overallScore,
          strengths: analysisResult.strengths,
          improvements: analysisResult.improvements,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(analysisResult.skillAssessment && { skillAssessment: analysisResult.skillAssessment as any }),
        },
      });

      return updatedAnswer;
    } catch (error) {
      console.error('Error updating answer with analysis:', error);
      throw new Error('Failed to update answer');
    }
  }

  // Update answer
  static async updateAnswer(answerId: string, data: Partial<JdAnswerData>) {
    try {
      const updatedAnswer = await prisma.jdAnswers.update({
        where: { id: answerId },
        data: {
          ...(data.questionText && { questionText: data.questionText }),
          ...(data.userAnswer && { userAnswer: data.userAnswer }),
          ...(data.feedback && { feedback: data.feedback }),
          ...(data.scores && { scores: data.scores }),
          ...(data.overallScore !== undefined && { overallScore: data.overallScore }),
          ...(data.strengths && { strengths: data.strengths }),
          ...(data.improvements && { improvements: data.improvements }),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(data.skillAssessment && { skillAssessment: data.skillAssessment as any }),
          ...(data.timeSpent !== undefined && { timeSpent: data.timeSpent }),
        },
      });

      return updatedAnswer;
    } catch (error) {
      console.error('Error updating answer:', error);
      throw new Error('Failed to update answer');
    }
  }

  // Get single answer
  static async getAnswer(jdQuestionSetId: string, questionIndex: number, userId: string) {
    try {
      const answer = await prisma.jdAnswers.findFirst({
        where: {
          jdQuestionSetId,
          questionIndex,
          userId,
        },
        include: {
          jdQuestionSet: {
            select: {
              jobTitle: true,
              questionType: true,
              level: true,
            },
          },
        },
      });

      return answer;
    } catch (error) {
      console.error('Error getting answer:', error);
      throw new Error('Failed to get answer');
    }
  }

  // Get all answers for a question set
  static async getAnswersByQuestionSet(jdQuestionSetId: string, userId: string) {
    try {
      const answers = await prisma.jdAnswers.findMany({
        where: {
          jdQuestionSetId,
          userId,
        },
        include: {
          jdQuestionSet: {
            select: {
              jobTitle: true,
              questionType: true,
              level: true,
            },
          },
        },
        orderBy: {
          questionIndex: 'asc',
        },
      });

      return answers;
    } catch (error) {
      console.error('Error getting answers by question set:', error);
      throw new Error('Failed to get answers');
    }
  }

  // Get user answer history
  static async getUserAnswerHistory(userId: string, limit = 20) {
    try {
      const answers = await prisma.jdAnswers.findMany({
        where: { userId },
        include: {
          jdQuestionSet: {
            select: {
              jobTitle: true,
              questionType: true,
              level: true,
            },
          },
        },
        orderBy: {
          answeredAt: 'desc',
        },
        take: limit,
      });

      return answers;
    } catch (error) {
      console.error('Error getting user answer history:', error);
      throw new Error('Failed to get answer history');
    }
  }

  // Get user statistics
  static async getUserStats(userId: string) {
    try {
      const totalAnswers = await prisma.jdAnswers.count({
        where: { userId },
      });

      const answers = await prisma.jdAnswers.findMany({
        where: { 
          userId,
          overallScore: { not: null }
        },
        include: {
          jdQuestionSet: {
            select: {
              questionType: true,
            },
          },
        },
      });

      const averageScore = answers.length > 0 
        ? answers.reduce((sum, a) => sum + (a.overallScore || 0), 0) / answers.length 
        : 0;

      const technicalAnswers = answers.filter(a => a.jdQuestionSet.questionType === 'technical');
      const behavioralAnswers = answers.filter(a => a.jdQuestionSet.questionType === 'behavioral');

      const technicalAverage = technicalAnswers.length > 0
        ? technicalAnswers.reduce((sum, a) => sum + (a.overallScore || 0), 0) / technicalAnswers.length
        : 0;

      const behavioralAverage = behavioralAnswers.length > 0
        ? behavioralAnswers.reduce((sum, a) => sum + (a.overallScore || 0), 0) / behavioralAnswers.length
        : 0;

      const recentAnswers = await prisma.jdAnswers.findMany({
        where: { userId },
        include: {
          jdQuestionSet: {
            select: {
              jobTitle: true,
              questionType: true,
              level: true,
            },
          },
        },
        orderBy: {
          answeredAt: 'desc',
        },
        take: 5,
      });

      return {
        totalAnswers,
        averageScore,
        technicalAverage,
        behavioralAverage,
        recentAnswers,
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw new Error('Failed to get user stats');
    }
  }

  // Delete answer
  static async deleteAnswer(answerId: string) {
    try {
      await prisma.jdAnswers.delete({
        where: { id: answerId },
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting answer:', error);
      throw new Error('Failed to delete answer');
    }
  }
}
