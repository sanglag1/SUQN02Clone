'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QuizStart from './QuizStart';
import QuizSession from './QuizSession';
import QuizResult from './QuizResult';

export type Question = {
  id: string;
  question: string;
  answers: {
    content: string;
    isCorrect?: boolean; // Optional vì có thể không có khi start quiz
  }[];
  explanation?: string;
  isMultipleChoice?: boolean; // Thêm thông tin về loại câu hỏi
};

export type Quiz = {
  id: string;
  field: string;
  topic: string;
  level: string;
  questions: Question[];
  timeLimit: number;
  userAnswers: {
    questionId: string;
    answerIndex: number[];
    isCorrect?: boolean; // Optional vì có thể không có khi start quiz
  }[];
  score: number;
  totalQuestions: number;
  timeUsed: number;
  answerMapping?: Record<string, number[]>; // Mapping vị trí câu trả lời
  completedAt?: string; // Thời gian hoàn thành quiz
};

interface QuizPanelProps {
  quizId?: string;
  initialQuiz?: Quiz; // Add initialQuiz prop for retry data
  onQuizStart?: (quiz: Quiz) => void;
  onQuizComplete?: (result: {
    userAnswers: { questionId: string; answerIndex: number[] }[];
    score: number;
    timeUsed: number;
    questions?: Question[];
    correctCount?: number;
    totalQuestions?: number;
  }) => void;
  onQuizCancel?: () => void;
  onNewQuiz?: () => void; // Add onNewQuiz prop
  currentStep?: 'config' | 'session' | 'result';
  setCurrentStep?: (step: 'config' | 'session' | 'result') => void;
  currentQuiz?: Quiz | null;
  setCurrentQuiz?: (quiz: Quiz | null) => void;
}

export default function QuizPanel({ 
  quizId, 
  initialQuiz,
  onQuizStart, 
  onQuizComplete, 
  onQuizCancel,
  onNewQuiz: externalOnNewQuiz,
  currentStep: externalStep,
  setCurrentStep: setExternalStep,
  currentQuiz: externalQuiz,
  setCurrentQuiz: setExternalQuiz
}: QuizPanelProps) {

  const router = useRouter();
  
  // Use external state if provided, otherwise use internal state
  const [internalStep, setInternalStep] = useState<'config' | 'session' | 'result'>('config');
  const [internalQuiz, setInternalQuiz] = useState<Quiz | null>(null);
  
  const step = externalStep !== undefined ? externalStep : internalStep;
  const setStep = setExternalStep || setInternalStep;
  const quiz = externalQuiz !== undefined ? externalQuiz : internalQuiz;
  const setQuiz = setExternalQuiz || setInternalQuiz;
  
  const [quizConfig, setQuizConfig] = useState({
    field: '',
    topic: '',
    level: '',
    questionCount: '10',
    timeLimit: '15',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);



  useEffect(() => {
    // Nếu có initialQuiz (từ retry API), sử dụng nó
    if (initialQuiz) {

      setQuiz(initialQuiz);
      setIsInitialized(true);
      
      // Quyết định step dựa trên quiz data
      if (initialQuiz.completedAt) {
        setStep('result');
      } else {
        setStep('session');
      }
      return;
    }

    // Chỉ fetch quiz nếu chưa được khởi tạo hoặc quizId thay đổi
    if (quizId && (!isInitialized || !quiz)) {
      const fetchQuizById = async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/quizzes/${quizId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch quiz');
          }
          const quizData = await response.json();
          
          // Kiểm tra xem quiz đã hoàn thành chưa để quyết định step
          
          // Set quiz trước
          setQuiz(quizData);
          setIsInitialized(true);
          
          // Sau đó quyết định step dựa trên quiz data
          if (quizData.completedAt) {
            // Quiz đã hoàn thành, hiển thị kết quả
            setStep('result');
          } else {
            // Quiz chưa hoàn thành, bắt đầu làm
            setStep('session');
          }
        } catch (error) {
          console.error('Error fetching quiz:', error);
          setError('Failed to load quiz');
        } finally {
          setLoading(false);
        }
      };
      fetchQuizById();
    } else if (step === 'config' && !quiz) {
      // Chỉ set về config nếu đang ở config step và chưa có quiz data
      setStep('config');
    }
  }, [quizId, setQuiz, setStep, step, isInitialized, quiz, initialQuiz]); // Thêm initialQuiz vào dependencies





  const handleQuizComplete = async (result: {
    userAnswers: { questionId: string; answerIndex: number[] }[];
    score: number;
    timeUsed: number;
    questions?: Question[];
    correctCount?: number;
    totalQuestions?: number;
  }) => {
    
    if (onQuizComplete) {
      onQuizComplete(result);
    } else {
      // Fallback to internal handling
      if (quiz) {
        const updatedQuiz = {
          ...quiz,
          userAnswers: result.userAnswers,
          score: result.score,
          timeUsed: result.timeUsed,
          questions: result.questions || quiz.questions,
          totalQuestions: result.totalQuestions || quiz.totalQuestions,
          completedAt: new Date().toISOString(), // Đánh dấu quiz đã hoàn thành
        };
        setQuiz(updatedQuiz);
        setStep('result');
      }
    }
  };

  const handleViewProfile = () => {
    router.push('/profile');
  };

  // If we're in session step, render QuizSession outside of dashboard layout for full screen
  if (step === 'session' && quiz) {
    return (
      <QuizSession
        quiz={quiz}
        onComplete={handleQuizComplete}
        onCancel={onQuizCancel || (() => setStep('config'))}
      />
    );
  }

  // For other steps, render within dashboard layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="relative container mx-auto px-4 py-6">
        {loading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading quiz...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {!loading && step === 'config' && (
          <>
            {}
            <QuizStart
              config={quizConfig}
              onChange={setQuizConfig}
              onStart={async (quizData: Quiz) => {
                setLoading(true);
                try {
                  if (onQuizStart) {
                    onQuizStart(quizData);
                  } else {
                    setQuiz(quizData);
                    setStep('session');
                  }
                } catch (error) {
                  console.error('Error setting quiz:', error);
                  setError('Failed to set quiz');
                } finally {
                  setLoading(false);
                }
              }}
              isLoading={loading}
              error={error}
            />
          </>
        )}

        {step === 'result' && quiz && (
          <QuizResult
            quiz={quiz}
            onNewQuiz={externalOnNewQuiz || (() => {
              // Fallback: reset everything and go to config
              console.log('Start New Quiz clicked - resetting state');
              setQuiz(null);
              setIsInitialized(false); // Reset initialization flag
              setLoading(false); // Reset loading state
              setError(null); // Reset error state
              setStep('config'); // Directly set to config, bypass safeSetStep
              // Remove any quiz ID from URL if present
              if (quizId) {
                router.replace('/quiz');
              }
            })}
            onRetryQuiz={(retryQuiz) => {
              console.log('Retry quiz received:', retryQuiz);
              // Navigate to new quiz page instead of setting quiz in same component
              // This prevents data conflict and reload issues
              router.push(`/quiz/${retryQuiz.id}`);
            }}
            onViewProfile={handleViewProfile}
          />
        )}
      </div>
    </div>
  );
}