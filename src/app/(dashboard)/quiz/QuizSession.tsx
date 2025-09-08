"use client"

import { useState, useEffect, useCallback } from 'react';
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, X, CheckCircle2, AlertTriangle, Timer, Target, Brain, Bookmark } from "lucide-react";
import type { Quiz, Question } from "./QuizPanel";

interface QuizSessionProps {
  quiz: Quiz;
  onComplete: (result: {
    userAnswers: { questionId: string; answerIndex: number[] }[];
    score: number;
    timeUsed: number;
    questions?: Question[];
    correctCount?: number;
    totalQuestions?: number;
  }) => void;
  onCancel: () => void;
}

export default function QuizSession({ quiz, onComplete, onCancel }: QuizSessionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ questionId: string; answerIndex: number[] }[]>([]);
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit * 60); // Convert minutes to seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Gọi API submit để tính điểm server-side (hoạt động với cả secure quiz và retry quiz)
      const submitRes = await fetch(`/api/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAnswers,
          timeUsed: quiz.timeLimit * 60 - timeLeft, // Add timeUsed to request
        }),
      });
      
      const result = await submitRes.json();
      if (result.error) {
        console.error('Error submitting quiz:', result.error);
        return;
      }

      onComplete({
        userAnswers,
        score: result.score,
        timeUsed: quiz.timeLimit * 60 - timeLeft,
        questions: result.questions,
        correctCount: result.correctCount,
        totalQuestions: result.totalQuestions,
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, userAnswers, quiz.id, quiz.timeLimit, timeLeft, onComplete]);

  const handleSubmitClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);
    handleSubmit();
  };

  const handleCancelSubmit = () => {
    setShowConfirmModal(false);
  };

  // Exit confirm modal handlers
  const handleExitClick = () => {
    setShowExitModal(true);
  };

  const handleConfirmExit = () => {
    setShowExitModal(false);
    onCancel();
  };

  const handleCancelExit = () => {
    setShowExitModal(false);
  };

  // Đóng modal khi click bên ngoài
  const handleModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowConfirmModal(false);
    }
  };
  const handleExitModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowExitModal(false);
    }
  };

  // Đóng modal khi nhấn ESC
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showConfirmModal) setShowConfirmModal(false);
        if (showExitModal) setShowExitModal(false);
      }
    };
    if (showConfirmModal || showExitModal) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [showConfirmModal, showExitModal]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          setTimeout(() => {
            handleSubmit();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleSubmit]);

  const handleAnswerSelect = (index: number) => {
    const currentAnswers = userAnswers.find(
      (answer) => answer.questionId === currentQuestion.id
    );

    // Sử dụng thông tin isMultipleChoice từ API
    const isMultipleChoice = currentQuestion.isMultipleChoice || false;

    if (isMultipleChoice) {
      // Multiple choice logic
      if (currentAnswers) {
        const newAnswers = userAnswers.filter(
          (answer) => answer.questionId !== currentQuestion.id
        );
        if (!currentAnswers.answerIndex.includes(index)) {
          newAnswers.push({
            questionId: currentQuestion.id,
            answerIndex: [...currentAnswers.answerIndex, index]
          });
        } else {
          const updatedIndexes = currentAnswers.answerIndex.filter(i => i !== index);
          newAnswers.push({
            questionId: currentQuestion.id,
            answerIndex: updatedIndexes
          });
        }
        setUserAnswers(newAnswers);
      } else {
        setUserAnswers([
          ...userAnswers,
          {
            questionId: currentQuestion.id,
            answerIndex: [index]
          }
        ]);
      }
    } else {
      // Single choice logic
      const newAnswers = userAnswers.filter(
        (answer) => answer.questionId !== currentQuestion.id
      );
      newAnswers.push({
        questionId: currentQuestion.id,
        answerIndex: [index]
      });
      setUserAnswers(newAnswers);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const userAnswer = userAnswers.find(
    (answer) => answer.questionId === currentQuestion.id
  );
  const isMultipleChoice = currentQuestion.isMultipleChoice || false;
  

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Calculate answered questions correctly - count unique questions that have answers
  const answeredQuestions = quiz.questions.filter((question) => 
    userAnswers.some(answer => answer.questionId === question.id)
  ).length;
  const progress = (answeredQuestions / quiz.questions.length) * 100;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-blue-50/30 overflow-hidden">
      {/* Header - Fixed at top */}
      <div className="h-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="h-full flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      Question {currentQuestionIndex + 1} of {quiz.questions.length}
                    </p>
              <div className="flex items-center gap-2 mt-1">
                    <Target className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {answeredQuestions}/{quiz.questions.length} answered
                    </span>
              </div>
            </div>
                  </div>

          <div className="flex items-center gap-4">
                  <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      timeLeft < 300 ? "bg-red-50 border border-red-200" : "bg-blue-50 border border-blue-200"
                    }`}
                  >
                    <Timer className={`w-4 h-4 ${timeLeft < 300 ? "text-red-600" : "text-blue-600"}`} />
              <span className={`text-lg font-bold ${timeLeft < 300 ? "text-red-600" : "text-blue-600"}`}>
                      {formatTime(timeLeft)}
                    </span>
            </div>

            <button
              onClick={handleExitClick}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-all duration-300"
            >
              <X className="w-4 h-4" />
              Exit
            </button>
                  </div>
                </div>
              </div>

      {/* Progress Bar - Fixed below header */}
      <div className="h-16 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="h-full flex items-center px-6">
          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-gray-200" />
              </div>
            </div>
              </div>



      {/* Main Content - Scrollable area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Question Panel - Left side */}
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/60 overflow-hidden flex flex-col">
              {/* Question Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800 flex-1 pr-4">{currentQuestion.question}</h2>
                <button
                  onClick={() => {
                    const newMarked = new Set(markedQuestions);
                    if (newMarked.has(currentQuestionIndex)) {
                      newMarked.delete(currentQuestionIndex);
                    } else {
                      newMarked.add(currentQuestionIndex);
                    }
                    setMarkedQuestions(newMarked);
                  }}
                    className={`p-2 rounded-lg transition-all duration-300 flex items-center justify-center flex-shrink-0 ${
                    markedQuestions.has(currentQuestionIndex)
                      ? "bg-red-500 text-white shadow-lg hover:bg-red-600"
                      : "bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500"
                  }`}
                  title={markedQuestions.has(currentQuestionIndex) ? "Remove mark" : "Mark as difficult"}
                >
                  <Bookmark className="w-5 h-5" />
                </button>
              </div>
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                {isMultipleChoice ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-800 font-medium text-sm">Choose all correct answers</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-800 font-medium text-sm">Choose one correct answer</span>
                  </>
                )}
              </div>
            </div>

              {/* Answers - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-3">
              {currentQuestion.answers.map((answer, index) => (
                <label
                  key={index}
                  className={`group flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                    userAnswer?.answerIndex.includes(index)
                      ? "border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50 shadow-md shadow-purple-500/20"
                      : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 bg-white/50"
                  }`}
                >
                  <input
                    type={isMultipleChoice ? "checkbox" : "radio"}
                    name={isMultipleChoice ? undefined : "answer"}
                    checked={userAnswer?.answerIndex.includes(index) || false}
                    onChange={() => handleAnswerSelect(index)}
                    className="mt-0.5 mr-3 w-4 h-4 text-purple-600 border-2 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-base text-gray-800 group-hover:text-gray-900 transition-colors">
                    {answer.content}
                  </span>
                  {userAnswer?.answerIndex.includes(index) && (
                    <CheckCircle2 className="w-4 h-4 text-purple-600 ml-auto" />
                  )}
                </label>
              ))}
                </div>
            </div>
            
              {/* Navigation Buttons - Fixed at bottom */}
              <div className="p-6 border-t border-gray-200 bg-gray-50/50">
                <div className="flex justify-end items-center">
                  <div className="flex gap-2">
                    <button
                      onClick={handlePrevious}
                      disabled={currentQuestionIndex === 0}
                          className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg font-medium transition-all duration-300 ${
                        currentQuestionIndex === 0
                          ? "opacity-50 cursor-not-allowed border-gray-200 text-gray-400"
                          : "border-gray-300 text-gray-700 hover:border-purple-300 hover:bg-purple-50"
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>

                    <button
                      onClick={handleNext}
                      disabled={currentQuestionIndex === quiz.questions.length - 1}
                          className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg font-medium transition-all duration-300 ${
                        currentQuestionIndex === quiz.questions.length - 1
                          ? "opacity-50 cursor-not-allowed border-gray-200 text-gray-400"
                          : "border-gray-300 text-gray-700 hover:border-purple-300 hover:bg-purple-50"
                      }`}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legend Panel - Right side */}
          <div className="w-64 bg-white/80 backdrop-blur-sm border-l border-gray-200 p-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 text-sm">Notes</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded"></div>
                  <span>Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Marked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
                  <span>Unanswered</span>
                </div>
              </div>

              {/* Question Navigation */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-800 text-sm mb-3">Question</h3>
                <div className="flex flex-wrap gap-2">
                  {quiz.questions.map((_, index) => {
                    const isAnswered = userAnswers.some(answer => answer.questionId === quiz.questions[index].id);
                    const isCurrent = index === currentQuestionIndex;
                    const isMarked = markedQuestions.has(index);
                    
                    return (
                      <button
                        key={index}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`w-8 h-8 rounded-lg font-bold text-xs transition-all duration-300 border-2 flex-shrink-0 ${
                          isCurrent
                            ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white border-purple-500 shadow-lg scale-110"
                            : isMarked
                            ? "bg-red-500 text-white border-red-500 hover:bg-red-600"
                            : isAnswered
                            ? "bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                            : "bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-800 text-sm mb-2">Quiz Info</h3>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Specialization:</span>
                    <span className="font-medium">{quiz.field}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Topic:</span>
                    <span className="font-medium">{quiz.topic}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Level:</span>
                    <span className="font-medium capitalize">{quiz.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Limit:</span>
                    <span className="font-medium">{quiz.timeLimit} min</span>
                  </div>
                </div>
                
                {/* Submit Button */}
                <div className="mt-4">
                  <button
                    onClick={handleSubmitClick}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-white shadow-lg transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="text-sm">Submitting...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm">Submit Quiz</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleModalBackdropClick}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Confirm Quiz Submission
                </h3>
                
                <p className="text-gray-600 mb-4">
                  Are you sure you want to submit your quiz? Once submitted, you cannot change your answers.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-800 font-medium">Total Questions:</span>
                    <span className="text-blue-900 font-bold">{quiz.questions.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-blue-800 font-medium">Answered:</span>
                    <span className="text-blue-900 font-bold">{answeredQuestions}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-blue-800 font-medium">Unanswered:</span>
                    <span className="text-blue-900 font-bold">{quiz.questions.length - answeredQuestions}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-blue-800 font-medium">Time Remaining:</span>
                    <span className="text-blue-900 font-bold">{formatTime(timeLeft)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-blue-800 font-medium">Time Used:</span>
                    <span className="text-blue-900 font-bold">{formatTime(quiz.timeLimit * 60 - timeLeft)}</span>
                  </div>
                </div>

                {quiz.questions.length - answeredQuestions > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-6">
                    <div className="flex items-center gap-2 text-orange-800">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Warning: You have {quiz.questions.length - answeredQuestions} unanswered questions!
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleCancelSubmit}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={handleConfirmSubmit}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white transition-all duration-200"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </div>
                    ) : (
                      'Confirm Submit'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exit Confirmation Modal */}
        {showExitModal && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleExitModalBackdropClick}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Confirm Exit Quiz
                </h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to exit? All progress will be lost and you cannot recover your answers.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-red-800 font-medium">Total Questions:</span>
                    <span className="text-red-900 font-bold">{quiz.questions.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-red-800 font-medium">Answered:</span>
                    <span className="text-red-900 font-bold">{answeredQuestions}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-red-800 font-medium">Unanswered:</span>
                    <span className="text-red-900 font-bold">{quiz.questions.length - answeredQuestions}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelExit}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmExit}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-gray-400 hover:from-red-600 hover:to-gray-500 rounded-xl font-bold text-white transition-all duration-200"
                  >
                    Confirm Exit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
