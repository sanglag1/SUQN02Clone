"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "react-hot-toast";
import {
  Bookmark,
  BookOpen,
  Search,
  Filter,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Brain,
  Target,
  TrendingUp,
  RotateCcw,
  Clock,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  X,
  Shuffle,
} from "lucide-react";
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface Question {
  id: string;
  question: string;
  answers: { content: string; isCorrect: boolean }[];
  explanation?: string;
  fields?: string[];
  topics?: string[];
  levels?: string[];
  savedAt?: string;
  difficulty?: "easy" | "medium" | "hard";
}

export default function QuizSaveQuestionPage() {
  const [savedQuestions, setSavedQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterField, setFilterField] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterTopic, setFilterTopic] = useState("all");
  const [showAnswers, setShowAnswers] = useState<Set<string>>(new Set());
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());

  // Flash Card States
  const [showFlashCards, setShowFlashCards] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flashCardQuestions, setFlashCardQuestions] = useState<Question[]>([]);
  const [isShuffled, setIsShuffled] = useState(false);

  const fetchSavedQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
  const response = await fetch("/api/questions/saved-questions");
      if (!response.ok) throw new Error("Failed to fetch saved questions");
      const data = await response.json();
      setSavedQuestions(data);
    } catch (error) {
      console.error("Error fetching saved questions:", error);
      toast.error("Failed to load saved questions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedQuestions();
  }, [fetchSavedQuestions]);

  const handleUnsaveQuestion = async (questionId: string) => {
    try {
  const response = await fetch("/api/questions/saved-questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId }),
      });
      if (!response.ok) throw new Error("Failed to unsave question");
      setSavedQuestions(savedQuestions.filter((q) => q.id !== questionId));
      toast.success("Question removed from saved list!");
    } catch (error) {
      console.error("Error unsaving question:", error);
      toast.error("Failed to remove question");
    }
  };

  const toggleAnswerVisibility = (questionId: string) => {
    const newShowAnswers = new Set(showAnswers);
    if (newShowAnswers.has(questionId)) {
      newShowAnswers.delete(questionId);
    } else {
      newShowAnswers.add(questionId);
    }
    setShowAnswers(newShowAnswers);
  };

  const toggleQuestionSelection = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  // Flash Card Functions
  const shuffleCards = () => {
    const shuffled = [...flashCardQuestions].sort(() => Math.random() - 0.5);
    setFlashCardQuestions(shuffled);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIsShuffled(true);
    toast.success("Cards shuffled!");
  };

  const nextCard = () => {
    if (currentCardIndex < flashCardQuestions.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const closeFlashCards = () => {
    setShowFlashCards(false);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIsShuffled(false);
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "hard":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };



  const filteredQuestions = savedQuestions.filter((question) => {
    const matchesSearch =
      question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.fields?.some(field => field.toLowerCase().includes(searchTerm.toLowerCase())) ||
      question.topics?.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesField = filterField === "all" || question.fields?.includes(filterField);
    const matchesLevel = filterLevel === "all" || question.levels?.includes(filterLevel);
    const matchesDifficulty = filterDifficulty === "all" || question.difficulty === filterDifficulty;
    const matchesTopic = filterTopic === "all" || question.topics?.includes(filterTopic);
    return matchesSearch && matchesField && matchesLevel && matchesDifficulty && matchesTopic;
  });

  const fields = Array.from(new Set(savedQuestions.flatMap(q => q.fields || [])));
  const levels = Array.from(new Set(savedQuestions.flatMap(q => q.levels || [])));
  const topics = Array.from(new Set(savedQuestions.flatMap(q => q.topics || [])));

  // Calculate best field and topic
  const fieldCounts = savedQuestions.reduce((acc, q) => {
    q.fields?.forEach(field => {
      acc[field] = (acc[field] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topicCounts = savedQuestions.reduce((acc, q) => {
    q.topics?.forEach(topic => {
      acc[topic] = (acc[topic] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const bestField = Object.keys(fieldCounts).length > 0 
    ? Object.entries(fieldCounts).reduce((a, b) => fieldCounts[a[0]] > fieldCounts[b[0]] ? a : b)[0]
    : "None";

  const bestTopic = Object.keys(topicCounts).length > 0
    ? Object.entries(topicCounts).reduce((a, b) => topicCounts[a[0]] > topicCounts[b[0]] ? a : b)[0]
    : "None";

  const currentCard = flashCardQuestions[currentCardIndex];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen to-indigo-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl font-semibold text-gray-700">Loading Saved Questions...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen">
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
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                        <Bookmark className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-800">{savedQuestions.length}</div>
                        <div className="text-sm text-gray-600">Total Saved</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-800 truncate">{bestField}</div>
                        <div className="text-sm text-gray-600">Best Field</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-800 truncate">{bestTopic}</div>
                        <div className="text-sm text-gray-600">Best Topic</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>


              </div>

            {/* Search and Filter */}
            <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl mb-8">
                {/* Action Bar with Search and Filters */}
                <CardContent className="p-4 space-y-3">
                  {/* Search and Filter Bar */}
                  <div className="flex w-full gap-4">
                    <div className="relative flex-grow min-w-[220px]">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search questions, fields, topics..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl bg-white/70 backdrop-blur-sm shadow-lg text-base"
                      />
                    </div>
                    <div className="relative min-w-[160px] flex-shrink-0">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={filterField}
                        onChange={(e) => setFilterField(e.target.value)}
                        className="w-full pl-10 pr-8 py-2 border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl bg-white/70 backdrop-blur-sm shadow-lg appearance-none text-base"
                      >
                        <option value="all">All Fields</option>
                        {fields.map((field) => (
                          <option key={field} value={field}>{field}</option>
                        ))}
                      </select>
                    </div>
                    <div className="relative min-w-[160px] flex-shrink-0">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={filterTopic}
                        onChange={(e) => setFilterTopic(e.target.value)}
                        className="w-full pl-10 pr-8 py-2 border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl bg-white/70 backdrop-blur-sm shadow-lg appearance-none text-base"
                      >
                        <option value="all">All Topics</option>
                        {topics.map((topic) => (
                          <option key={topic} value={topic}>{topic}</option>
                        ))}
                      </select>
                    </div>
                    <div className="relative min-w-[160px] flex-shrink-0">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={filterLevel}
                        onChange={(e) => setFilterLevel(e.target.value)}
                        className="w-full pl-10 pr-8 py-2 border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl bg-white/70 backdrop-blur-sm shadow-lg appearance-none text-base"
                      >
                        <option value="all">All Levels</option>
                        {levels.map((level) => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardContent>
            </Card>

            {/* Questions List */}
            {filteredQuestions.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Bookmark className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No Saved Questions Found</h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm || filterField !== "all" || filterLevel !== "all"
                      ? "Try adjusting your search or filter criteria."
                      : "Start saving questions during quizzes to build your collection."}
                  </p>
                  <button
                    onClick={() => (window.location.href = "/quiz")}
                    className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    Take a Quiz
                  </button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredQuestions.map((question, index) => (
                  <Card key={question.id || index} className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedQuestions.has(question.id)}
                            onChange={() => toggleQuestionSelection(question.id)}
                            className="mt-1 w-5 h-5 text-orange-600 border-2 border-gray-300 rounded focus:ring-orange-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex gap-2">
                                {question.fields && question.fields[0] && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-lg border border-blue-200">
                                    {question.fields[0]}
                                  </span>
                                )}
                                {question.topics && question.topics[0] && (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-lg border border-purple-200">
                                    {question.topics[0]}
                                  </span>
                                )}
                                {question.levels && question.levels[0] && (
                                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-lg border border-orange-200">
                                    {question.levels[0]}
                                  </span>
                                )}
                                {question.difficulty && (
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-lg border ${getDifficultyColor(question.difficulty)}`}
                                  >
                                    🔥 {question.difficulty}
                                  </span>
                )}
              </div>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4">{question.question}</h3>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleAnswerVisibility(question.id)}
                            className={`p-2 rounded-lg transition-all duration-300 ${
                              showAnswers.has(question.id)
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600"
                            }`}
                            title={showAnswers.has(question.id) ? "Hide Answers" : "Show Answers"}
                          >
                            {showAnswers.has(question.id) ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleUnsaveQuestion(question.id)}
                            className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all duration-300"
                            title="Remove from Saved"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Answers */}
                      <div className="space-y-3 mb-4">
                        {question.answers.map((answer, aIndex) => (
                          <div
                            key={answer.content + aIndex}
                            className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                              showAnswers.has(question.id)
                                ? answer.isCorrect
                                  ? "border-green-300 bg-green-50 text-green-800"
                                  : "border-red-300 bg-red-50 text-red-800"
                                : "border-gray-200 bg-gray-50 text-gray-700"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {showAnswers.has(question.id) && (
                                <>
                                  {answer.isCorrect ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-red-600" />
                                  )}
                                </>
                              )}
                              <span
                                className={`${showAnswers.has(question.id) && answer.isCorrect ? "font-bold" : ""}`}
                              >
                                {answer.content}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Explanation */}
                      {question.explanation && showAnswers.has(question.id) && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <BookOpen className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-semibold text-blue-800">Explanation:</span>
                              <p className="text-blue-700 mt-1">{question.explanation}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Saved Date */}
                      {question.savedAt && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
                          <Clock className="w-3 h-3" />
                          Saved on {new Date(question.savedAt).toLocaleDateString()}
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
                    onClick={() => (window.location.href = "/quiz")}
                    className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 rounded-lg border border-purple-200 transition-all duration-300"
                  >
                    <Brain className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-gray-800">Take New Quiz</span>
                  </button>

                  <button
                    onClick={() => (window.location.href = "/history")}
                    className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-lg border border-green-200 transition-all duration-300"
                  >
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-800">Quiz History</span>
                  </button>

                  <button
                    onClick={() => {
                      if (showAnswers.size === filteredQuestions.length) {
                        setShowAnswers(new Set());
                      } else {
                        setShowAnswers(new Set(filteredQuestions.map((q) => q.id)));
                      }
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${
                      showAnswers.size === filteredQuestions.length
                        ? "bg-gradient-to-r from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100 border-gray-200"
                        : "bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border-blue-200"
                    }`}
                  >
                    {showAnswers.size === filteredQuestions.length ? (
                      <>
                        <EyeOff className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-800">Hide All Answers</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-gray-800">Show All Answers</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      // Use selected questions if any, otherwise use all filtered questions
                      const questionsToStudy = selectedQuestions.size > 0 
                        ? savedQuestions.filter((q) => selectedQuestions.has(q.id))
                        : filteredQuestions;

                      if (questionsToStudy.length === 0) {
                        toast.error("No questions available for flash cards");
                        return;
                      }

                      setFlashCardQuestions(questionsToStudy);
                      setCurrentCardIndex(0);
                      setIsFlipped(false);
                      setShowFlashCards(true);
                      toast.success(`Starting flash cards with ${questionsToStudy.length} questions`);
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-lg border border-purple-200 transition-all duration-300"
                  >
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-gray-800">
                      Flash card {selectedQuestions.size > 0 ? `(${selectedQuestions.size})` : "(All)"}
                    </span>
                  </button>
                </div>

                {/* Note about checkbox configuration */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700">
                    <span className="font-medium">Note:</span> Can configure by checkbox selection for custom flash card sets.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Study Tips */}
            <Card className="bg-white/80 backdrop-blur-lg border-white/50 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800">Study Tips</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <RotateCcw className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-sm">
                      <div className="text-gray-800 font-medium">Review Regularly</div>
                      <div className="text-gray-600 text-xs">Practice saved questions weekly</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-sm">
                      <div className="text-gray-800 font-medium">Focus on Weak Areas</div>
                      <div className="text-gray-600 text-xs">Save challenging questions</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-sm">
                      <div className="text-gray-800 font-medium">Use Flash Cards</div>
                      <div className="text-gray-600 text-xs">Interactive learning mode</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Flash Cards Modal */}
      {showFlashCards && currentCard && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-1 sm:p-2">
          <div className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-2xl max-w-7xl w-full max-h-[98vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Flash Cards</h2>
                  <p className="text-sm text-gray-600">
                    Card {currentCardIndex + 1} of {flashCardQuestions.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={shuffleCards}
                  className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all duration-300"
                  title="Shuffle Cards"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
                <button
                  onClick={closeFlashCards}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="px-6 py-2 bg-gray-50">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{Math.round(((currentCardIndex + 1) / flashCardQuestions.length) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${((currentCardIndex + 1) / flashCardQuestions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Card Content */}
            <div className="p-8">
              {/* Question Info */}
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                {currentCard.fields && currentCard.fields[0] && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full border border-blue-200">
                    {currentCard.fields[0]}
                  </span>
                )}
                {currentCard.topics && currentCard.topics[0] && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full border border-purple-200">
                    {currentCard.topics[0]}
                  </span>
                )}
                {currentCard.levels && currentCard.levels[0] && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full border border-orange-200">
                    {currentCard.levels[0]}
                  </span>
                )}
              </div>

              {/* Flash Card */}
              <div
                className={`relative w-full h-[24rem] cursor-pointer transition-transform duration-700 transform-style-preserve-3d ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
                onClick={flipCard}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Front Side - Question */}
                <div
                  className={`absolute inset-0 w-full h-full backface-hidden rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col items-start justify-start p-0 ${
                    isFlipped ? "rotate-y-180" : ""
                  }`}
                  style={{ backfaceVisibility: "hidden" }}
                >
                  {currentCard.question.length > 100 ? (
                    <h3 className="w-full font-bold text-gray-800 mt-8 mb-4 leading-relaxed text-center break-words text-base">{currentCard.question}</h3>
                  ) : (
                    <h3 className="w-full font-bold text-gray-800 mt-8 mb-4 leading-relaxed text-center break-words text-xl">{currentCard.question}</h3>
                  )}
                  <div className="w-full flex-1 max-h-48 overflow-y-auto bg-gradient-to-br from-purple-50 to-blue-50 rounded-none p-0 shadow-none">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full px-6 py-3">
                      {currentCard.answers.map((answer, idx) => (
                        <div key={idx} className="p-4 bg-purple-100 border-2 border-purple-300 rounded-lg text-purple-800 font-medium w-full">
                          {answer.content}
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="w-full text-sm text-gray-600 mt-4 text-center">Click to reveal answer</p>
                </div>

                {/* Back Side - Answer */}
                <div
                  className={`absolute inset-0 w-full h-full backface-hidden rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-0 rotate-y-180 ${
                    isFlipped ? "" : "rotate-y-180"
                  }`}
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <div className="h-full w-full flex flex-col items-start justify-start">
                    <div className="flex items-center gap-2 mt-8 mb-4 w-full px-4">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                      <h4 className="text-lg font-bold text-gray-800">Answers:</h4>
                    </div>
                    <div className="w-full flex-1 max-h-48 overflow-y-auto bg-gradient-to-br from-green-50 to-emerald-50 rounded-none p-0 shadow-none mb-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full px-6 py-3">
                        {currentCard.answers.map((answer, index) => (
                          <div
                            key={answer.content + index}
                            className={`p-4 border rounded-lg font-medium w-full ${
                              answer.isCorrect
                                ? "bg-green-200 border-green-300 text-green-800"
                                : "bg-red-200 border-red-300 text-red-800"
                            }`}
                          >
                            {answer.isCorrect ? "✓" : "✗"} {answer.content}
                          </div>
                        ))}
                      </div>
                    </div>
                    {currentCard.explanation && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg w-full max-h-32 overflow-y-auto">
                        <div className="flex items-start gap-2 w-full">
                          <BookOpen className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-blue-800">Explanation:</span>
                            <p className="text-blue-700 mt-1 break-words">{currentCard.explanation}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={prevCard}
                disabled={currentCardIndex === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  currentCardIndex === 0
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {currentCardIndex + 1} / {flashCardQuestions.length}
                </span>
                {isShuffled && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Shuffled</span>
                )}
              </div>

              <button
                onClick={nextCard}
                disabled={currentCardIndex === flashCardQuestions.length - 1}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  currentCardIndex === flashCardQuestions.length - 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
} 