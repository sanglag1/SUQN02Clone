import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

interface QuestionAnalysis {
  questionId?: string;
  question?: string;
  userAnswer?: string;
  score?: number;
  feedback?: string;
}

interface ConversationMessage {
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
}

interface EvaluationData {
  overallRating?: number;
  communicationScore?: number;
  technicalScore?: number;
  problemSolvingScore?: number;
  confidenceScore?: number;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  detailedFeedback?: string;
  questionAnalysis?: QuestionAnalysis[];
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await getAuth(req);
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: interviewId } = await params;
    if (!interviewId) {
      return NextResponse.json({ error: 'Interview ID is required' }, { status: 400 });
    }

    // Tìm user theo clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Lấy thông tin phiên phỏng vấn và đánh giá
    const interview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        userId: user.id
      },
      include: {
        jobRole: {
          include: {
            category: true,
            specialization: true
          }
        }
      }
    });

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Nếu chưa có đánh giá, tạo đánh giá mẫu hoặc trả về lỗi
    if (!interview.evaluation) {
      return NextResponse.json({ 
        error: 'Evaluation not available yet',
        message: 'Đánh giá chưa có sẵn. Vui lòng thử lại sau.' 
      }, { status: 404 });
    }

    // Parse evaluation data từ Json field
    const evaluation = interview.evaluation as EvaluationData;

    // Parse conversation history từ Json field
    const conversationHistory = (interview.conversationHistory as unknown as ConversationMessage[]) || [];

    // Tính toán thời gian phiên
    const startTime = new Date(interview.startTime);
    const endTime = interview.endTime ? new Date(interview.endTime) : new Date();
    const sessionDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // Tạo response data
    const evaluationData = {
      id: interview.id,
      interviewId: interview.id,
      overallScore: evaluation.overallRating || 0,
      communicationScore: evaluation.communicationScore || 0,
      technicalScore: evaluation.technicalScore || 0,
      problemSolvingScore: evaluation.problemSolvingScore || 0,
      confidenceScore: evaluation.confidenceScore || 0,
      strengths: evaluation.strengths || [],
      weaknesses: evaluation.weaknesses || [],
      recommendations: evaluation.recommendations || [],
      detailedFeedback: evaluation.detailedFeedback || 'Không có đánh giá chi tiết.',
      questionAnalysis: evaluation.questionAnalysis || [],
      conversationHistory: conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      })),
      sessionDuration,
      totalQuestions: interview.questionCount || 0,
      completedAt: interview.endTime || interview.startTime,
      jobRoleTitle: interview.jobRole?.title || 'Không xác định',
      jobRoleLevel: interview.jobRole?.level || 'Không xác định'
    };

    return NextResponse.json(evaluationData);

  } catch (error) {
    console.error('Error fetching interview evaluation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 