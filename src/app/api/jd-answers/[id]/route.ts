import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { JdAnswerService, AnalysisResult } from '@/services/jdAnswerService';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const answerId = resolvedParams.id;

    const body = await request.json();
    const {
      questionText,
      userAnswer,
      analysisResult,
      timeSpent
    }: {
      questionText: string;
      userAnswer: string;
      analysisResult?: AnalysisResult;
      timeSpent?: number;
    } = body;

    // Validate required fields
    if (!questionText || !userAnswer) {
      return NextResponse.json({
        error: 'Missing required fields: questionText, userAnswer'
      }, { status: 400 });
    }

    // Update the answer
    const result = await JdAnswerService.updateAnswer(answerId, {
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
    });

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Error updating JD answer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const answerId = resolvedParams.id;

    // Delete the answer
    await JdAnswerService.deleteAnswer(answerId);

    return NextResponse.json({
      success: true,
      message: 'Answer deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting JD answer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
