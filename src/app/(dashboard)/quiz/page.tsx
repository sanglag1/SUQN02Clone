'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import QuizPanel from './QuizPanel';
import QuizSession from './QuizSession';
import type { Quiz, Question } from './QuizPanel';

function QuizPageContent() {
  const [currentStep, setCurrentStep] = useState<'config' | 'session' | 'result'>('config');
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const searchParams = useSearchParams();
  const quizId = searchParams.get('id');

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
        questions: result.questions || currentQuiz.questions,
        totalQuestions: result.totalQuestions || currentQuiz.totalQuestions,
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

  // Handle new quiz - reset everything and go to config
  const handleNewQuiz = () => {
    setCurrentQuiz(null);
    setCurrentStep('config');
  };

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
        onNewQuiz={handleNewQuiz}
        currentStep={currentStep}
        setCurrentStep={safeSetCurrentStep}
        currentQuiz={currentQuiz}
        setCurrentQuiz={setCurrentQuiz}
      />
    </DashboardLayout>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuizPageContent />
    </Suspense>
  );
}