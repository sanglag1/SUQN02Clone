'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import QuizPanel from "../QuizPanel";
import QuizSession from "../QuizSession";
import type { Quiz, Question } from "../QuizPanel";

interface QuizPageProps {
  params: Promise<{ quizId: string }>;
}

export default function QuizPage({ params }: QuizPageProps) {
  const [quizId, setQuizId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'config' | 'session' | 'result'>('config');
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setQuizId(resolvedParams.quizId);
      setIsLoading(false);
    };
    resolveParams();
  }, [params]);

  // Prevent automatic reset to config when we have quiz data and are in result step
  const safeSetCurrentStep = (step: 'config' | 'session' | 'result') => {
    // Don't reset to config if we have quiz data and are currently in result step
    if (step === 'config' && currentStep === 'result' && currentQuiz) {
      return;
    }
    setCurrentStep(step);
  };

  // Handle quiz session completion
  const handleQuizComplete = (result: {
    userAnswers: { questionId: string; answerIndex: number[] }[];
    score: number;
    timeUsed: number;
    questions?: Question[];
    correctCount?: number;
    totalQuestions?: number;
  }) => {
    if (currentQuiz) {
      const updatedQuiz = {
        ...currentQuiz,
        userAnswers: result.userAnswers,
        score: result.score,
        timeUsed: result.timeUsed,
        // Use result.questions if available, they contain isCorrect flag
        questions: result.questions && result.questions.length > 0 ? result.questions : currentQuiz.questions,
        totalQuestions: result.totalQuestions || currentQuiz.totalQuestions,
        completedAt: new Date().toISOString(), // Đánh dấu quiz đã hoàn thành
      };
      
      setCurrentQuiz(updatedQuiz);
      safeSetCurrentStep('result');
    }
  };

  // Handle quiz start
  const handleQuizStart = (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    safeSetCurrentStep('session');
  };

  // Handle quiz cancel
  const handleQuizCancel = () => {
    safeSetCurrentStep('config');
    setCurrentQuiz(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  // If we're in session step, render QuizSession outside of dashboard layout for full screen
  if (currentStep === 'session' && currentQuiz) {
    return (
      <QuizSession
        quiz={currentQuiz}
        onComplete={handleQuizComplete}
        onCancel={handleQuizCancel}
      />
    );
  }

  // For other steps, render within dashboard layout
  return (
    <DashboardLayout>
      <QuizPanel 
        quizId={quizId || undefined}
        onQuizStart={handleQuizStart}
        onQuizComplete={handleQuizComplete}
        onQuizCancel={handleQuizCancel}
        currentStep={currentStep}
        setCurrentStep={safeSetCurrentStep}
        currentQuiz={currentQuiz}
        setCurrentQuiz={setCurrentQuiz}
      />
    </DashboardLayout>
  );
}