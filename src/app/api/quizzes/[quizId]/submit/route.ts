import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { TrackingIntegrationService } from '@/services/trackingIntegrationService';
import { QuizMappingService } from '@/hooks/useQuizMapping';

// Handle OPTIONS request for CORS preflight


export async function POST(
  req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return (NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const { userAnswers, timeUsed } = await req.json();
    const { quizId } = await params;

    // Lấy quiz với questions gốc (có isCorrect)
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

    // Lấy questions gốc từ database để có answers chính xác
    const originalQuestions = await prisma.question.findMany({
      where: {
        id: { in: quiz.questions.map((q: { id: string }) => q.id) }
      }
    });

    if (!quiz) {
      return (NextResponse.json({ error: 'Quiz not found' }, { status: 404 }));
    }

    // Tính điểm server-side
    let correctCount = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const questionsWithCorrectAnswers = quiz.questions.map((question: any) => {
      const userAnswer = userAnswers.find((a: { questionId: string; answerIndex: number[] }) => a.questionId === question.id);
      
      // Lấy answers gốc từ originalQuestions
      const originalQuestion = originalQuestions.find((q: { id: string }) => q.id === question.id);
      const answers = originalQuestion?.answers as Array<{ content: string; isCorrect?: boolean }> || [];
      
      if (!userAnswer || !answers) {
        return {
          ...question,
          userSelectedIndexes: [],
          isCorrect: false
        };
      }

      // Xử lý trường hợp user không chọn đáp án nào
      if (!userAnswer.answerIndex || userAnswer.answerIndex.length === 0) {
        return {
          ...question,
          userSelectedIndexes: [],
          isCorrect: false
        };
      }

      // 1. Chuyển đổi user answers từ shuffled về original indexes
      const answerMapping = quiz.answerMapping as Record<string, number[]> || {};
      const convertedUserAnswers = QuizMappingService.convertUserAnswers(userAnswers, answerMapping);
      const userAnswerConverted = convertedUserAnswers.find(a => a.questionId === question.id);
      
      let originalSelectedIndexes: number[];
      if (userAnswerConverted) {
        originalSelectedIndexes = userAnswerConverted.answerIndex;
      } else {
        originalSelectedIndexes = userAnswer.answerIndex || [];
      }



      // Tính toán đáp án đúng từ vị trí gốc
      const correctIndexes = answers
        .map((answer: { content: string; isCorrect?: boolean }, idx: number) => answer.isCorrect ? idx : -1)
        .filter((idx: number) => idx !== -1);

      // Kiểm tra đáp án đúng - sắp xếp cả hai mảng để so sánh chính xác
      const sortedSelected = [...originalSelectedIndexes].sort();
      const sortedCorrect = [...correctIndexes].sort();
      const isCorrect = (
        sortedSelected.length === sortedCorrect.length &&
        sortedSelected.every((idx: number, i: number) => idx === sortedCorrect[i])
      );

      console.log(`Question ${question.id}: result=${isCorrect ? 'correct' : 'incorrect'}`);

      if (isCorrect) {
        correctCount++;
      }

      // Trả về câu hỏi với đáp án đúng và kết quả
      return {
        ...question,
        userSelectedIndexes: userAnswer.answerIndex, // Giữ nguyên shuffled indexes để hiển thị đúng với answers đã shuffle
        isCorrect,
        // 2. Trả về answers theo thứ tự user đã thấy (shuffled) với isCorrect
        answers: (() => {
          const mapping = answerMapping[question.id] || [];
          if (mapping.length > 0) {
            return QuizMappingService.createShuffledAnswersWithCorrect(answers, mapping);
          } else {
            return answers.map((answer: { content: string; isCorrect?: boolean }) => ({
              content: answer.content,
              isCorrect: answer.isCorrect
            }));
          }
        })()
      };
    });

    // Tính điểm
    const score = Math.round((correctCount / quiz.questions.length) * 10);

    // Update quiz với kết quả
    const updatedQuiz = await prisma.quiz.update({
      where: { id: quizId },
      data: {
        userAnswers,
        score,
        timeUsed: timeUsed || 0, // Save timeUsed from request
        completedAt: new Date(),
      },
    });

    // Tracking quiz completion
    try {
      // Chuyển đổi questions sang format phù hợp nếu cần
      const questions = Array.isArray(quiz.questions)
        ? quiz.questions.map((q: { topics?: string[] }) => ({ topics: q.topics || [] }))
        : [];
      // Gọi tracking
      await TrackingIntegrationService.trackQuizCompletion(
        quiz.userId,
        questions,
        correctCount,
        Math.max(1, Math.round((quiz.timeUsed || 0) / 60)) // luôn >= 1 phút
      );
    } catch (err) {
      console.error('Error tracking quiz completion:', err);
    }

    return (NextResponse.json({
      quiz: updatedQuiz,
      questions: questionsWithCorrectAnswers,
      score,
      correctCount,
      totalQuestions: quiz.questions.length
    }));
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return (NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
} 