import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { JdAnswerService, JdAnswerData, AnalysisResult } from '@/services/jdAnswerService';
import { UserActivityService } from '@/services/userActivityService';
import { ActivityType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      jdQuestionSetId,
      questionIndex,
      questionText,
      userAnswer,
      analysisResult,
      timeSpent
    }: {
      jdQuestionSetId: string;
      questionIndex: number;
      questionText: string;
      userAnswer: string;
      analysisResult?: AnalysisResult;
      timeSpent?: number;
    } = body;

    // Validate required fields
    if (!jdQuestionSetId || questionIndex === undefined || !questionText || !userAnswer) {
      return NextResponse.json({
        error: 'Missing required fields: jdQuestionSetId, questionIndex, questionText, userAnswer'
      }, { status: 400 });
    }

    // Prepare answer data
    const answerData: JdAnswerData = {
      userId,
      jdQuestionSetId,
      questionIndex,
      questionText,
      userAnswer,
      timeSpent,
      ...(analysisResult && {
        feedback: analysisResult.feedback,
        scores: analysisResult.detailedScores,
        overallScore: analysisResult.overallScore,
        strengths: analysisResult.strengths,
        improvements: analysisResult.improvements,
        skillAssessment: analysisResult.skillAssessment,
      }),
    };

    // Check if answer already exists
    const existingAnswer = await JdAnswerService.getAnswer(jdQuestionSetId, questionIndex, userId);

    let result;
    if (existingAnswer) {
      // Update existing answer
      result = await JdAnswerService.updateAnswerWithAnalysis(
        existingAnswer.id,
        analysisResult || {
          feedback: '',
          detailedScores: {},
          overallScore: 0,
          strengths: [],
          improvements: [],
        }
      );
    } else {
      // Create new answer
      result = await JdAnswerService.saveAnswer(answerData);
    }

    
    try {
      await UserActivityService.addActivity(userId, {
        type: ActivityType.jd,
        referenceId: jdQuestionSetId,
        score: undefined, // Don't track score for JD activities
        duration: timeSpent || 0,
        timestamp: new Date()
      });
    } catch (activityError) {
      console.error(' Error tracking JD activity:', activityError);
      // Don't fail the main operation if activity tracking fails
    }

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Error in JD answers API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const jdQuestionSetId = url.searchParams.get('jdQuestionSetId');
    const questionIndex = url.searchParams.get('questionIndex');
    const questionSetId = url.searchParams.get('questionSetId'); // Alternative parameter name
    const type = url.searchParams.get('type'); // 'single', 'set', 'history', 'stats', 'check'

    switch (type) {
      case 'check':
        // Check if answer exists for this question
        const checkQuestionSetId = jdQuestionSetId || questionSetId;
        if (!checkQuestionSetId || questionIndex === null) {
          return NextResponse.json({
            error: 'Missing questionSetId or questionIndex for check'
          }, { status: 400 });
        }

        const existingAnswer = await JdAnswerService.getAnswer(
          checkQuestionSetId,
          parseInt(questionIndex),
          userId
        );

        return NextResponse.json({
          success: true,
          exists: !!existingAnswer,
          answerId: existingAnswer?.id || null,
        });

      case 'single':
        if (!jdQuestionSetId || questionIndex === null) {
          return NextResponse.json({
            error: 'Missing jdQuestionSetId or questionIndex for single answer'
          }, { status: 400 });
        }

        const answer = await JdAnswerService.getAnswer(
          jdQuestionSetId,
          parseInt(questionIndex),
          userId
        );

        return NextResponse.json({
          success: true,
          data: answer,
        });

      case 'set':
        if (!jdQuestionSetId) {
          return NextResponse.json({
            error: 'Missing jdQuestionSetId for answer set'
          }, { status: 400 });
        }

        const answers = await JdAnswerService.getAnswersByQuestionSet(jdQuestionSetId, userId);

        return NextResponse.json({
          success: true,
          data: answers,
        });

      case 'history':
        const limit = url.searchParams.get('limit');
        const history = await JdAnswerService.getUserAnswerHistory(
          userId,
          limit ? parseInt(limit) : 20
        );

        return NextResponse.json({
          success: true,
          data: history,
        });

      case 'stats':
        const stats = await JdAnswerService.getUserStats(userId);

        return NextResponse.json({
          success: true,
          data: stats,
        });

      default:
        return NextResponse.json({
          error: 'Invalid type parameter. Use: single, set, history, or stats'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in JD answers GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const answerId = url.searchParams.get('answerId');

    if (!answerId) {
      return NextResponse.json({
        error: 'Missing answerId parameter'
      }, { status: 400 });
    }

    const result = await JdAnswerService.deleteAnswer(answerId);

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Error in JD answers DELETE API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
