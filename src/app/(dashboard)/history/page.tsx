"use client";

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, Clock, Target, Trophy, Eye, RotateCcw, Calendar, CheckCircle2, XCircle, BookOpen, TrendingUp, Award, History, Filter, Search, } from "lucide-react"
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface Quiz {
    id: string
    field: string
    topic: string
    level: string
    completedAt: string
    score: number
    timeUsed: number
    timeLimit: number
    userAnswers: {
        questionId: string
        answerIndex: number[]
        isCorrect: boolean
    }[]
    totalQuestions: number
    retryCount: number
    questions?: Question[]
}

interface Question {
    id: string
    question: string
    answers: { content: string; isCorrect: boolean }[]
    explanation?: string
}

export default function QuizHistoryPage() {
    const [quizHistory, setQuizHistory] = useState<Quiz[]>([])
    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterLevel, setFilterLevel] = useState("all")
    const router = useRouter()

    const fetchQuizHistory = useCallback(async () => {
        try {
            setIsLoading(true)
            const response = await fetch("/api/quizzes/history")
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || `HTTP ${response.status}`)
            }
            const data = await response.json()
            // API trả về { quizzes: [...], stats: {...} }
            if (data && typeof data === 'object' && Array.isArray(data.quizzes)) {
                setQuizHistory(data.quizzes)
            } else {
                console.warn('Unexpected API response format:', data)
                setQuizHistory([])
            }
        } catch (error) {
            console.error("Error fetching quiz history:", error)
            setQuizHistory([]) // Set empty array on error
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchQuizHistory()
    }, [fetchQuizHistory])

    const handleViewQuizDetails = async (quiz: Quiz) => {
        if (selectedQuiz?.id === quiz.id) {
            setSelectedQuiz(null)
        } else {
            try {
                const response = await fetch(`/api/quizzes/${quiz.id}`)
                if (!response.ok) throw new Error("Failed to fetch quiz details")
                const quizDetails = await response.json()
                setSelectedQuiz(quizDetails)
            } catch (error) {
                console.error("Error fetching quiz details:", error)
            }
        }
    }

    const handleRetryQuiz = async (quiz: Quiz) => {
        try {
            const response = await fetch(`/api/quizzes/${quiz.id}/retry`, {
                method: "POST",
            })
            if (!response.ok) throw new Error("Failed to retry quiz")
            const newQuiz = await response.json()
            router.push(`/quiz/${newQuiz.id}`)
        } catch (error) {
            console.error("Error retrying quiz:", error)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}m ${secs}s`
    }

    // Score is now 0-10, so convert to percent for display and color
    const getScoreColor = (score: number) => {
        const percent = score * 10;
        if (percent >= 80) return "from-green-500 to-emerald-500";
        if (percent >= 60) return "from-blue-500 to-cyan-500";
        if (percent >= 40) return "from-yellow-500 to-orange-500";
        return "from-red-500 to-pink-500";
    }

    const getScoreBadgeColor = (score: number) => {
        const percent = score * 10;
        if (percent >= 80) return "bg-green-100 text-green-800 border-green-200";
        if (percent >= 60) return "bg-blue-100 text-blue-800 border-blue-200";
        if (percent >= 40) return "bg-yellow-100 text-yellow-800 border-yellow-200";
        return "bg-red-100 text-red-800 border-red-200";
    }

    // Đảm bảo quizHistory luôn là array
    const safeQuizHistory = Array.isArray(quizHistory) ? quizHistory : [];
    
    const filteredQuizzes = safeQuizHistory.filter((quiz) => {
        if (!quiz || !quiz.field || !quiz.topic || !quiz.completedAt) return false;
        const matchesSearch =
            (quiz.field?.toLowerCase?.().includes(searchTerm.toLowerCase()) || false) ||
            (quiz.topic?.toLowerCase?.().includes(searchTerm.toLowerCase()) || false);
        const matchesLevel = filterLevel === "all" || quiz.level === filterLevel;
        return matchesSearch && matchesLevel;
    })

    const completedQuizzes = safeQuizHistory.filter(quiz => quiz.completedAt)
    const totalQuizzes = completedQuizzes.length
    // averageScore and highestScore are now 0-10, so convert to percent for display
    const averageScore =
    totalQuizzes > 0 ? Number((completedQuizzes.reduce((sum, quiz) => sum + (quiz.score || 0), 0) / totalQuizzes).toFixed(1)) : 0;
    const highestScore = totalQuizzes > 0 ? Math.max(...completedQuizzes.map((quiz) => quiz.score || 0)) : 0;

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
                    <div className="absolute inset-0">
                        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl animate-pulse" />
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse delay-1000" />
                    </div>
                    <div className="relative z-10 text-center">
                        <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-xl font-semibold text-gray-700">Loading Quiz History...</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse delay-1000" />
                </div>

                <div className="relative z-10 container mx-auto px-4 py-8">


                    <div className="grid lg:grid-cols-4 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-3">
                            {/* Stats Cards */}
                            <div className="grid md:grid-cols-3 gap-6 mb-8">
                                <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                                                <Target className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-gray-800">{totalQuizzes}</div>
                                                <div className="text-sm text-gray-600">Total Quizzes</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                                <TrendingUp className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-gray-800">{averageScore}/10</div>
                                                <div className="text-sm text-gray-600">Average Score</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                                                <Trophy className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-gray-800">{highestScore}/10</div>
                                                <div className="text-sm text-gray-600">Best Score</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Search and Filter */}
                            <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl mb-8">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search by field or topic..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl bg-white/70 backdrop-blur-sm shadow-lg"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <select
                                                value={filterLevel}
                                                onChange={(e) => setFilterLevel(e.target.value)}
                                                className="pl-10 pr-8 py-3 border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl bg-white/70 backdrop-blur-sm shadow-lg appearance-none"
                                            >
                                                <option value="all">All Levels</option>
                                                <option value="junior">Junior</option>
                                                <option value="middle">Middle</option>
                                                <option value="senior">Senior</option>
                                            </select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quiz History List */}
                            {filteredQuizzes.length === 0 ? (
                                <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
                                    <CardContent className="p-12 text-center">
                                        <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <History className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Quiz History Found</h3>
                                        <p className="text-gray-600 mb-6">
                                            {searchTerm || filterLevel !== "all"
                                                ? "Try adjusting your search or filter criteria."
                                                : "Start taking quizzes to see your history here."}
                                        </p>
                                        <button
                                            onClick={() => router.push("/quiz")}
                                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
                                        >
                                            Take Your First Quiz
                                        </button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-6">
                                    {filteredQuizzes.map((quiz) => (
                                        <Card key={quiz.id || quiz.id || Math.random()} className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
                                            <CardContent className="p-6">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div
                                                                className={`w-10 h-10 bg-gradient-to-r ${getScoreColor(quiz.score || 0)} rounded-xl flex items-center justify-center`}
                                                            >
                                                                <Brain className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-xl font-bold text-gray-800">
                                                                    {(quiz.field || "Unknown Field")} - {(quiz.topic || "Unknown Topic")}
                                                                </h3>
                                                                <p className="text-gray-600 capitalize">{quiz.level ? `${quiz.level} Level` : "Unknown Level"}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="w-4 h-4" />
                                                                {quiz.completedAt ? new Date(quiz.completedAt).toLocaleDateString() : "N/A"}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="w-4 h-4" />
                                                                {formatTime(quiz.timeUsed || 0)}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Target className="w-4 h-4" />
                                                                {(() => {
                                                                    // Tính số câu đúng dựa trên score (hệ số 10) và tổng số câu hỏi
                                                                    const totalQuestions = quiz.totalQuestions || 0;
                                                                    const score = quiz.score || 0;
                                                                    const correctCount = Math.round((score / 10) * totalQuestions);
                                                                    return `${correctCount}/${totalQuestions} correct`;
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        <div className={`px-4 py-2 rounded-xl border-2 font-bold ${getScoreBadgeColor(quiz.score || 0)}`}> 
                                                            {(quiz.score ?? 0)}/10
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleViewQuizDetails(quiz)}
                                                                className={`p-3 rounded-xl transition-all duration-300 ${(selectedQuiz?.id === (quiz.id || quiz.id))
                                                                        ? "bg-blue-100 text-blue-600 border-2 border-blue-200"
                                                                        : "bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600 border-2 border-transparent hover:border-blue-200"
                                                                    }`}
                                                                title="View Details"
                                                            >
                                                                <Eye className="w-5 h-5" />
                                                            </button>

                                                            <button
                                                                onClick={() => handleRetryQuiz(quiz)}
                                                                className="p-3 rounded-xl bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600 border-2 border-transparent hover:border-green-200 transition-all duration-300"
                                                                title="Retry Quiz"
                                                            >
                                                                <RotateCcw className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {selectedQuiz?.id === (quiz.id || quiz.id) && (
                                                    <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                                                        <div className="grid md:grid-cols-2 gap-6">
                                                            <div>
                                                                <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-4">
                                                                    <Award className="w-5 h-5 text-blue-600" />
                                                                    Quiz Details
                                                                </h4>
                                                                <div className="space-y-2 text-sm">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Time Used:</span>
                                                                        <span className="font-medium">{formatTime(selectedQuiz.timeUsed || 0)}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Time Limit:</span>
                                                                        <span className="font-medium">{selectedQuiz.timeLimit ? `${selectedQuiz.timeLimit}m` : "N/A"}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Retry Count:</span>
                                                                        <span className="font-medium">{selectedQuiz.retryCount ?? 0}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-4">
                                                                    <BookOpen className="w-5 h-5 text-blue-600" />
                                                                    Question Review
                                                                </h4>
                                                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                                                    {selectedQuiz.questions?.map((question, index) => (
                                                                        <div key={question.id || question.id || index} className="p-3 bg-white rounded-lg border border-blue-100">
                                                                            <p className="font-medium text-sm mb-2">
                                                                                {index + 1}. {question.question || "No question text"}
                                                                            </p>
                                                                            <div className="space-y-1">
                                                                                {question.answers?.map((answer, aIndex) => {
                                                                                    const userAnswer = selectedQuiz.userAnswers?.find(
                                                                                        (ua) => ua.questionId === (question.id || question.id)
                                                                                    );
                                                                                    const isSelected = userAnswer?.answerIndex?.includes(aIndex) || false;
                                                                                    const isCorrect = answer.isCorrect;

                                                                                    const baseClass = "p-3 rounded-lg border flex items-center gap-3 font-medium";
                                                                                    let answerClass = "";
                                                                                    let icon = null;

                                                                                    if (isSelected && isCorrect) {
                                                                                        answerClass = "border-green-300 bg-green-100 text-green-800";
                                                                                        icon = <CheckCircle2 className="w-5 h-5 text-green-600" />;
                                                                                    } else if (isSelected && !isCorrect) {
                                                                                        answerClass = "border-red-300 bg-red-100 text-red-800";
                                                                                        icon = <XCircle className="w-5 h-5 text-red-600" />;
                                                                                    } else if (!isSelected && isCorrect) {
                                                                                        answerClass = "border-green-300 bg-green-50 text-green-700";
                                                                                        icon = <CheckCircle2 className="w-5 h-5 text-green-500" />;
                                                                                    } else {
                                                                                        answerClass = "border-gray-200 bg-white text-gray-600";
                                                                                    }

                                                                                    return (
                                                                                        <div key={aIndex} className={`${baseClass} ${answerClass}`}>
                                                                                            {icon}
                                                                                            <span>{answer.content || "No answer text"}</span>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    ))}

                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Quick Actions */}
                            <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                            <Target className="w-4 h-4 text-white" />
                                        </div>
                                        <h3 className="font-bold text-gray-800">Quick Actions</h3>
                                    </div>

                                    <div className="space-y-3">
                                        <button
                                            onClick={() => router.push("/quiz")}
                                            className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 rounded-lg border border-purple-200 transition-all duration-300"
                                        >
                                            <Brain className="w-5 h-5 text-purple-600" />
                                            <span className="font-medium text-gray-800">Take New Quiz</span>
                                        </button>

                                        <button
                                            onClick={() => router.push("/saved")}
                                            className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-lg border border-green-200 transition-all duration-300"
                                        >
                                            <BookOpen className="w-5 h-5 text-green-600" />
                                            <span className="font-medium text-gray-800">Saved Questions</span>
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Performance Insights */}
                            <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                                            <TrendingUp className="w-4 h-4 text-white" />
                                        </div>
                                        <h3 className="font-bold text-gray-800">Performance Insights</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-gray-600">Overall Progress</span>
                                                <span className="text-green-600 font-medium">{averageScore}/10</span>
                                            </div>
                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse"
                                                    style={{ width: `${averageScore * 10}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-gray-200">
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-green-600">
                                                    {averageScore >= 80 ? "Excellent!" : averageScore >= 60 ? "Good Progress!" : "Keep Learning!"}
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    {averageScore >= 80
                                                        ? "You're mastering the topics!"
                                                        : averageScore >= 60
                                                            ? "You're on the right track!"
                                                            : "Practice makes perfect!"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
} 
