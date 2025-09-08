"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "react-hot-toast"
import { Trophy, Clock, Target, CheckCircle2, XCircle, BookOpen, RotateCcw, History, Bookmark, Brain, Sparkles, Award, TrendingUp, Eye, EyeOff } from "lucide-react"
import type { Quiz, Question } from "./QuizPanel"

// Extended types for quiz results
interface QuestionResult extends Question {
  isCorrect?: boolean;
  userSelectedIndexes?: number[];
  answers: {
    content: string;
    isCorrect?: boolean;
  }[];
}

interface QuizResultData extends Quiz {
  questions: QuestionResult[];
}

interface QuizResultProps {
  quiz: QuizResultData
  onNewQuiz: () => void
  onRetryQuiz?: (retryQuiz: Quiz) => void // Add prop to handle retry quiz data
  onViewProfile?: () => void // made optional for compatibility
}

export default function QuizResult({ quiz, onNewQuiz, onRetryQuiz }: QuizResultProps) {
  const router = useRouter()
  const [savedQuestionIds, setSavedQuestionIds] = useState<string[]>([]) // Already saved questions from server
  const [pendingSaveIds, setPendingSaveIds] = useState<string[]>([]) // Questions marked for saving locally
  const [showSaveWarning, setShowSaveWarning] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [showCorrectAnswers, setShowCorrectAnswers] = useState<Record<string, boolean>>({}) // Track which questions show correct answers

  useEffect(() => {
    const fetchSavedQuestions = async () => {
      try {
  const response = await fetch("/api/questions/saved-questions")
        if (!response.ok) throw new Error("Failed to fetch saved questions")
        const data = await response.json()
        const savedIds = data.map((q: { id: string }) => q.id);
        setSavedQuestionIds(savedIds)
        console.log('Fetched saved question IDs:', savedIds.length)
      } catch (error) {
        console.error("Error fetching saved questions:", error)
        toast.error("Failed to load saved questions.")
      }
    }
    fetchSavedQuestions()
  }, [])

  // Get incorrect questions that haven't been saved (including pending saves)
  const getUnsavedIncorrectQuestions = () => {
    const unsaved = quiz.questions.filter(question => {
      // Use same logic as question review to determine correctness
      const questionResult = question as QuestionResult;
      let isCorrect = questionResult.isCorrect;
      
      // Fallback logic for retry quiz - calculate isCorrect if not available
      if (isCorrect === undefined && quiz.userAnswers) {
        const userAnswer = quiz.userAnswers.find(ua => ua.questionId === question.id);
        if (userAnswer && question.answers) {
          const userSelectedIndexes = userAnswer.answerIndex || [];
          // Check if user's answers match correct answers
          const correctIndexes = question.answers
            .map((answer, idx) => answer.isCorrect ? idx : -1)
            .filter(idx => idx !== -1);
          
          const sortedSelected = [...userSelectedIndexes].sort();
          const sortedCorrect = [...correctIndexes].sort();
          isCorrect = (
            sortedSelected.length === sortedCorrect.length &&
            sortedSelected.every((idx, i) => idx === sortedCorrect[i])
          );
        } else {
          isCorrect = false;
        }
      }
      
      const isIncorrect = isCorrect === false; // Only false means incorrect
      const isAlreadySaved = savedQuestionIds.includes(question.id)
      const isPendingSave = pendingSaveIds.includes(question.id)
      const isNotSaved = !isAlreadySaved && !isPendingSave
      
      return isIncorrect && isNotSaved
    })
    
    return unsaved
  }

  const unsavedIncorrectCount = getUnsavedIncorrectQuestions().length + pendingSaveIds.length

  // Debug log for save warning popup
  console.log('QuizResult - Save warning check:', {
    unsavedIncorrectCount,
    pendingSaveIds: pendingSaveIds.length,
    actualUnsaved: getUnsavedIncorrectQuestions().length,
    totalQuestions: quiz.questions?.length,
    hasIsCorrectFlags: quiz.questions?.some(q => (q as QuestionResult).isCorrect !== undefined),
    savedQuestionIds: savedQuestionIds.length
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const handleSaveQuestion = async (questionId: string) => {
    // Toggle pending save state locally instead of calling API immediately
    if (pendingSaveIds.includes(questionId)) {
      setPendingSaveIds(pendingSaveIds.filter((id) => id !== questionId))
      toast.success("Question unmarked for saving!")
    } else {
      setPendingSaveIds([...pendingSaveIds, questionId])
      toast.success("Question marked for saving!")
    }
  }

  const toggleShowCorrectAnswers = (questionId: string) => {
    setShowCorrectAnswers(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }))
  }

  const correctAnswers = (() => {
    // Try to get correct count from quiz questions with isCorrect flag
    const questionsWithResults = quiz.questions.filter((q) => (q as QuestionResult).isCorrect === true);
    
    if (questionsWithResults.length > 0) {
      return questionsWithResults.length;
    }
    
    // Fallback: calculate from score and total questions (for retry quiz)
    if (quiz.score !== undefined && quiz.totalQuestions) {
      return Math.round((quiz.score / 100) * quiz.totalQuestions);
    }
    
    return 0;
  })();
  
  const displayScore = Math.round((quiz.score ?? 0) * 10)
  const isPassingScore = displayScore >= 70

  const handleRetryQuiz = async () => {
    try {
      const response = await fetch(`/api/quizzes/${quiz.id}/retry`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to retry quiz');
      const newQuiz = await response.json();
      
      // Always navigate to new quiz page to prevent data conflicts
      router.push(`/quiz/${newQuiz.id || newQuiz._id}`);
      
      // Optional: If parent needs to handle retry, call it but don't rely on it
      if (onRetryQuiz) {
        onRetryQuiz(newQuiz);
      }
    } catch (error) {
      console.error('Error retrying quiz:', error);
      toast.error('Failed to retry quiz');
    }
  };

  // Handle navigation with warning
  const handleNavigation = (action: string, callback: () => void) => {
    const totalItemsToSave = getUnsavedIncorrectQuestions().length + pendingSaveIds.length
    console.log('handleNavigation called:', { action, totalItemsToSave, pendingSaves: pendingSaveIds.length });
    if (totalItemsToSave > 0) {
      console.log('Showing save warning popup')
      setShowSaveWarning(true)
      setPendingNavigation(action)
    } else {
      console.log('No unsaved questions, proceeding with navigation')
      callback()
    }
  }

  const handleConfirmNavigation = () => {
    setShowSaveWarning(false)
    if (pendingNavigation === 'newQuiz') {
      onNewQuiz()
    } else if (pendingNavigation === 'history') {
      router.push("/history")
    } else if (pendingNavigation === 'saved') {
      router.push("/saved")
    } else if (pendingNavigation === 'retry') {
      handleRetryQuiz()
    }
    setPendingNavigation(null)
  }

  const handleCancelNavigation = () => {
    setShowSaveWarning(false)
    setPendingNavigation(null)
  }

  // Save all questions marked for saving (both incorrect unsaved + pending saves)
  const handleSaveAllIncorrect = async () => {
    const unsavedIncorrect = getUnsavedIncorrectQuestions()
    const allQuestionsToSave = [...unsavedIncorrect.map(q => q.id), ...pendingSaveIds]
    
    // Remove duplicates
    const uniqueQuestionsToSave = Array.from(new Set(allQuestionsToSave))
    
    if (uniqueQuestionsToSave.length === 0) {
      toast.success("No questions to save!")
      return
    }

    let savedCount = 0

    for (const questionId of uniqueQuestionsToSave) {
      try {
        const response = await fetch("/api/questions/saved-questions", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ questionId }),
        })
        if (response.ok) {
          savedCount++
          setSavedQuestionIds(prev => [...prev, questionId])
        }
      } catch (error) {
        console.error("Error saving question:", error)
      }
    }

    if (savedCount > 0) {
      toast.success(`Successfully saved ${savedCount} questions for later study!`)
      setPendingSaveIds([]) // Clear pending saves after successful save
      setShowSaveWarning(false)
      setPendingNavigation(null)
      // Redirect to saved questions page after successful save
      router.push("/saved")
    } else {
      toast.error("Failed to save questions. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="relative">
              <div
                className={`w-16 h-16 bg-gradient-to-r ${isPassingScore ? "from-green-500 to-emerald-500" : "from-orange-500 to-red-500"} rounded-2xl flex items-center justify-center shadow-2xl`}
              >
                {isPassingScore ? <Trophy className="w-8 h-8 text-white" /> : <Brain className="w-8 h-8 text-white" />}
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center animate-bounce">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {isPassingScore ? "Congratulations!!!" : "Quiz Completed!"}
              </h1>
              <p className="text-purple-600 font-medium">Your Results</p>
            </div>
          </div>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            {isPassingScore
              ? "Excellent work! You have demonstrated strong knowledge in this area."
              : "Good effort! Review the explanations below to improve your understanding."}
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Score Card */}
            <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className={`text-6xl font-bold mb-4 ${isPassingScore ? "text-green-600" : "text-orange-600"}`}>
                    {displayScore}%
                  </div>

                  <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
                      <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-800">{quiz.totalQuestions}</div>
                      <div className="text-sm text-gray-600">Questions</div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                      <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-800">{correctAnswers}</div>
                      <div className="text-sm text-gray-600">Correct</div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                      <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-800">{formatTime(quiz.timeUsed)}</div>
                      <div className="text-sm text-gray-600">Time Used</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur-lg opacity-30 animate-pulse" />
                    <button
                      onClick={() => handleNavigation('newQuiz', onNewQuiz)}
                      className="relative w-full flex items-center justify-center gap-3 h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl font-bold text-white shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                      <RotateCcw className="w-5 h-5" />
                      Start New Quiz
                    </button>
                  </div>

                  <button
                    onClick={() => handleNavigation('history', () => router.push("/history"))}
                    className="w-full flex items-center justify-center gap-3 h-14 bg-white/70 hover:bg-white/90 border-2 border-gray-200 hover:border-purple-300 rounded-xl font-semibold text-gray-700 hover:text-purple-700 shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <History className="w-5 h-5" />
                    Your Quiz History
                  </button>

                  <button
                    onClick={() => handleNavigation('saved', () => router.push("/saved"))}
                    className="w-full flex items-center justify-center gap-3 h-14 bg-white/70 hover:bg-white/90 border-2 border-gray-200 hover:border-orange-300 rounded-xl font-semibold text-gray-700 hover:text-orange-700 shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <Bookmark className="w-5 h-5" />
                    Your Saved Questions
                  </button>
                </div>
                
                {/* Save All Button - Show when there are pending saves */}
                {pendingSaveIds.length > 0 && (
                  <div className="mt-4">
                    <button
                      onClick={handleSaveAllIncorrect}
                      className="w-full flex items-center justify-center gap-3 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 rounded-xl font-bold text-white shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                      <Bookmark className="w-5 h-5" />
                      Save All Marked Questions ({pendingSaveIds.length})
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Question Review */}
            <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Question Review</h3>
                </div>

                <div className="space-y-6">
                  {quiz.questions.map((question, qIndex) => {
                    // Sử dụng thông tin từ question result (có từ API submit)
                    const questionResult = question as QuestionResult;
                    let isCorrect = questionResult.isCorrect;
                    let userSelectedIndexes = questionResult.userSelectedIndexes || [];
                    
                    // Fallback logic for retry quiz - calculate isCorrect if not available
                    if (isCorrect === undefined && quiz.userAnswers) {
                      const userAnswer = quiz.userAnswers.find(ua => ua.questionId === question.id);
                      if (userAnswer && question.answers) {
                        userSelectedIndexes = userAnswer.answerIndex || [];
                        // Check if user's answers match correct answers
                        const correctIndexes = question.answers
                          .map((answer, idx) => answer.isCorrect ? idx : -1)
                          .filter(idx => idx !== -1);
                        
                        const sortedSelected = [...userSelectedIndexes].sort();
                        const sortedCorrect = [...correctIndexes].sort();
                        isCorrect = (
                          sortedSelected.length === sortedCorrect.length &&
                          sortedSelected.every((idx, i) => idx === sortedCorrect[i])
                        );
                      } else {
                        isCorrect = false;
                      }
                    }
                    
                    const isSaved = savedQuestionIds.includes(question.id)
                    const isPendingSave = pendingSaveIds.includes(question.id)

                    return (
                      <div
                        key={question.id}
                        className={`p-6 border-2 rounded-xl transition-all duration-300 ${
                          isCorrect
                            ? "border-green-200 bg-gradient-to-r from-green-50 to-emerald-50"
                            : "border-red-200 bg-gradient-to-r from-red-50 to-orange-50"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                                isCorrect ? "bg-green-500" : "bg-red-500"
                              }`}
                            >
                              {qIndex + 1}
                            </div>
                            <div className="flex-1">
                              {/* Question Type Indicator - moved to top */}
                              <div className="flex items-center gap-2 mb-2">
                                {(() => {
                                  // Use isMultipleChoice if available, otherwise determine from answers
                                  let isMultipleChoice = false;
                                  
                                  if (question.isMultipleChoice !== undefined) {
                                    isMultipleChoice = question.isMultipleChoice;
                                  } else if (question.answers) {
                                    // Fallback: determine from correct answers count
                                    const correctAnswersCount = question.answers.filter(a => a.isCorrect).length;
                                    isMultipleChoice = correctAnswersCount > 1;
                                  }
                                  
                                  return isMultipleChoice ? (
                                    <>
                                      <span className="text-blue-600 font-medium text-lg italic">Multiple Choice</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-purple-600 font-medium text-lg italic">Single Choice</span>
                                    </>
                                  );
                                })()}
                              </div>
                              
                              <h4 className="font-bold text-gray-800 text-lg mb-2">{question.question}</h4>
                              <div className="flex items-center gap-2 mb-3">
                                {isCorrect ? (
                                  <>
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    <span className="text-green-700 font-medium">Correct</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-5 h-5 text-red-600" />
                                    <span className="text-red-700 font-medium">Incorrect</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {/* Eye button - only show for incorrect questions */}
                            {!isCorrect && (
                              <button
                                onClick={() => toggleShowCorrectAnswers(question.id)}
                                className={`p-2 rounded-lg transition-all duration-300 ${
                                  showCorrectAnswers[question.id]
                                    ? "bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200"
                                    : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                                }`}
                                title={showCorrectAnswers[question.id] ? "Hide Correct Answers" : "Show Correct Answers"}
                              >
                                {showCorrectAnswers[question.id] ? (
                                  <EyeOff className="w-5 h-5" />
                                ) : (
                                  <Eye className="w-5 h-5" />
                                )}
                              </button>
                            )}

                            {/* Save button */}
                            <button
                              onClick={() => handleSaveQuestion(question.id)}
                              className={`p-2 rounded-lg transition-all duration-300 ${
                                isSaved
                                  ? "bg-orange-100 text-orange-700 border border-orange-300 hover:bg-orange-200"
                                  : isPendingSave
                                  ? "bg-yellow-100 text-yellow-700 border border-yellow-300 hover:bg-yellow-200"
                                  : isCorrect
                                  ? "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200"
                                  : "bg-red-100 text-red-700 border border-red-300 hover:bg-red-200"
                              }`}
                              title={isSaved ? "Already Saved" : isPendingSave ? "Marked for Saving" : "Mark for Saving"}
                            >
                              <Bookmark className={`w-5 h-5 ${isSaved || isPendingSave ? "fill-current" : ""}`} />
                            </button>
                          </div>
                        </div>

                        <div className="ml-11 space-y-3">
                          {question.answers.map((answer, aIndex) => {
                            // Check if answer has isCorrect property (from API submit)
                            // If not, this might be a retry quiz that needs fallback logic
                            let isThisAnswerCorrect = answer.isCorrect;
                            
                            // Fallback: if answer doesn't have isCorrect, try to get from original question data
                            if (isThisAnswerCorrect === undefined) {
                              // For retry quiz, we might not have isCorrect in shuffled answers
                              // This is expected - the logic above should handle overall correctness
                              isThisAnswerCorrect = false; // Default to false if not available
                            }
                            
                            const userSelectedThisAnswer = userSelectedIndexes.includes(aIndex);

                            let answerClass = "p-3 rounded-lg border "
                            let iconClass = ""

                            // Check if we're in "show correct answers" mode for this question
                            const showCorrectMode = showCorrectAnswers[question.id];

                            // Logic hiển thị màu sắc:
                            if (showCorrectMode) {
                              // Show correct answers mode - only show green for correct answers
                              if (isThisAnswerCorrect) {
                                answerClass += "border-green-300 bg-green-100 text-green-800"
                                iconClass = "text-green-600"
                              } else {
                                answerClass += "border-gray-200 bg-gray-50 text-gray-600"
                              }
                            } else {
                              // Normal mode - show user's selected answers with correct/incorrect indication
                              if (userSelectedThisAnswer) {
                                // User selected this answer - show if it's correct or incorrect
                                if (isThisAnswerCorrect) {
                                  // User selected correct answer
                                  answerClass += "border-green-300 bg-green-100 text-green-800"
                                  iconClass = "text-green-600"
                                } else {
                                  // User selected incorrect answer  
                                  answerClass += "border-red-300 bg-red-100 text-red-800"
                                  iconClass = "text-red-600"
                                }
                              } else {
                                // User didn't select this answer - neutral
                                answerClass += "border-gray-200 bg-gray-50 text-gray-600"
                              }
                            }

                            return (
                              <div key={aIndex} className={answerClass}>
                                <div className="flex items-center gap-3">
                                  {/* Show icons based on mode */}
                                  {showCorrectMode ? (
                                    // In show correct mode, only show check for correct answers
                                    isThisAnswerCorrect && (
                                      <CheckCircle2 className={`w-5 h-5 ${iconClass}`} />
                                    )
                                  ) : (
                                    // Normal mode - show icons for user selected answers with correct/incorrect indication
                                    userSelectedThisAnswer && (
                                      isThisAnswerCorrect ? (
                                        <CheckCircle2 className={`w-5 h-5 ${iconClass}`} />
                                      ) : (
                                        <XCircle className={`w-5 h-5 ${iconClass}`} />
                                      )
                                    )
                                  )}
                                  <span className="font-medium">{answer.content}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {question.explanation && (
                          <div className="mt-4 ml-11 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <BookOpen className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="font-semibold text-blue-800">Explanation:</span>
                                <p className="text-blue-700 mt-1">{question.explanation}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Performance Summary */}
            <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800">Performance Summary</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Accuracy</span>
                      <span className={`font-medium ${isPassingScore ? "text-green-600" : "text-orange-600"}`}>
                        {displayScore}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full animate-pulse ${
                          isPassingScore
                            ? "bg-gradient-to-r from-green-400 to-emerald-400"
                            : "bg-gradient-to-r from-orange-400 to-red-400"
                        }`}
                        style={{ width: `${displayScore}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Time Efficiency</span>
                      <span className="text-blue-600 font-medium">
                        {Math.round((quiz.timeUsed / (quiz.timeLimit * 60)) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-pulse"
                        style={{ width: `${Math.round((quiz.timeUsed / (quiz.timeLimit * 60)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-center">
                      <div className={`text-lg font-bold ${isPassingScore ? "text-green-600" : "text-orange-600"}`}>
                        {isPassingScore ? "Excellent!" : "Keep Learning!"}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {isPassingScore ? "You have mastered this topic" : "Review and try again"}
                      </div>
                      {!isPassingScore && (
                        <button
                          onClick={() => handleNavigation('retry', handleRetryQuiz)}
                          className="mt-3 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold shadow transition"
                        >
                          Try Again
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Study Recommendations */}
            <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800">Study Recommendations</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-sm">
                      <div className="text-gray-800 font-medium">Review saved questions</div>
                      <div className="text-gray-600 text-xs">Focus on weak areas</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-sm">
                      <div className="text-gray-800 font-medium">Practice more quizzes</div>
                      <div className="text-gray-600 text-xs">Build confidence</div>
                    </div>
                  </div>

                  {unsavedIncorrectCount > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                        <Bookmark className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-sm">
                        <div className="text-gray-800 font-medium">
                          {pendingSaveIds.length > 0 ? "Questions marked for saving" : "Save incorrect questions"}
                        </div>
                        <div className="text-gray-600 text-xs">
                          {pendingSaveIds.length > 0 
                            ? `${pendingSaveIds.length} marked + ${getUnsavedIncorrectQuestions().length} unsaved`
                            : `${getUnsavedIncorrectQuestions().length} questions to save`
                          }
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Save Warning Modal */}
      {showSaveWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bookmark className="w-8 h-8 text-white" />
              </div>
                             <h3 className="text-xl font-bold text-gray-800 mb-2">Save Your Progress?</h3>
               <p className="text-gray-600 mb-6">
                 {pendingSaveIds.length > 0 && getUnsavedIncorrectQuestions().length > 0 
                   ? `You have marked ${pendingSaveIds.length} questions for saving and ${getUnsavedIncorrectQuestions().length} unsaved incorrect questions. Would you like to save them all for later study?`
                   : pendingSaveIds.length > 0 
                   ? `You have marked ${pendingSaveIds.length} question${pendingSaveIds.length > 1 ? 's' : ''} for saving. Would you like to save them for later study?`
                   : `We noticed you haven't saved ${getUnsavedIncorrectQuestions().length} question${getUnsavedIncorrectQuestions().length > 1 ? 's' : ''} (incorrect). Would you like to save them for later study?`
                 }
               </p>
               
               <div className="space-y-3">
                 <button
                   onClick={handleSaveAllIncorrect}
                   className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
                 >
                   Save all & Redirect to the saved list
                 </button>
                <button
                  onClick={handleConfirmNavigation}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all duration-300"
                >
                  Continue Without Saving
                </button>
                <button
                  onClick={handleCancelNavigation}
                  className="w-full text-gray-500 hover:text-gray-700 font-medium py-2 px-6 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}