"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { 
  History, 
  Calendar, 
  TrendingUp, 
  Target,
  ChevronRight,
  ArrowLeft,
  Trash2,
  Filter,
  Search,
  Download,
  Eye,
  Star,
  ChevronDown,
  X,
  BarChart3,
  BookOpen,
  Brain,
  Sparkles,
  Timer,
  Trophy,
  Activity,
  Layers,
  FileText,
  Settings
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';

interface JdQuestionSet {
  id: string;
  jobTitle: string;
  questionType: 'technical' | 'behavioral' | 'mixed';
  level: 'entry' | 'mid' | 'senior';
}

interface JdAnswer {
  id: string;
  userId: string;
  jdQuestionSetId: string;
  questionIndex: number;
  questionText: string;
  userAnswer: string;
  feedback?: string;
  scores?: Record<string, number>;
  overallScore?: number;
  strengths?: string[];
  improvements?: string[];
  skillAssessment?: Record<string, unknown>;
  timeSpent?: number;
  answeredAt: Date;
  jdQuestionSet: JdQuestionSet;
}

export default function JdInterviewHistoryPage() {
  const { user } = useUser();
  const [answers, setAnswers] = useState<JdAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<JdAnswer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [answerToDelete, setAnswerToDelete] = useState<string | null>(null);
  
  // Enhanced filtering and search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'technical' | 'behavioral'>('all');
  const [filterLevel, setFilterLevel] = useState<'all' | 'entry' | 'mid' | 'senior'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'jobTitle'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    if (user) {
      loadAnswerHistory();
    }
  }, [user]);

  const loadAnswerHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/jd-answers?type=history&limit=100');
      const data = await response.json();

      if (data.success) {
        setAnswers(data.data.map((answer: JdAnswer) => ({
          ...answer,
          answeredAt: new Date(answer.answeredAt),
        })));
      } else {
        setError(data.error || 'Failed to load answer history');
      }
    } catch (error) {
      console.error('Error loading answer history:', error);
      setError('Failed to load answer history');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnswer = async (answerId: string) => {
    setAnswerToDelete(answerId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAnswer = async () => {
    if (!answerToDelete) return;

    try {
      setDeleteLoading(answerToDelete);
      const response = await fetch(`/api/jd-answers?answerId=${answerToDelete}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setAnswers(prev => prev.filter(answer => answer.id !== answerToDelete));
        if (selectedAnswer?.id === answerToDelete) {
          setShowDetailModal(false);
          setSelectedAnswer(null);
        }
      } else {
        alert('Failed to delete answer: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting answer:', error);
      alert('Failed to delete answer');
    } finally {
      setDeleteLoading(null);
      setShowDeleteConfirm(false);
      setAnswerToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setAnswerToDelete(null);
  };

  const openDetailModal = (answer: JdAnswer) => {
    setSelectedAnswer(answer);
    setShowDetailModal(true);
  };

  // Enhanced filtering and sorting
  const filteredAndSortedAnswers = useMemo(() => {
    const filtered = answers.filter(answer => {
      const matchesSearch = answer.jdQuestionSet.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           answer.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           answer.userAnswer.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || answer.jdQuestionSet.questionType === filterType;
      const matchesLevel = filterLevel === 'all' || answer.jdQuestionSet.level === filterLevel;
      
      return matchesSearch && matchesType && matchesLevel;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = a.answeredAt.getTime() - b.answeredAt.getTime();
          break;
        case 'score':
          comparison = (a.overallScore || 0) - (b.overallScore || 0);
          break;
        case 'jobTitle':
          comparison = a.jdQuestionSet.jobTitle.localeCompare(b.jdQuestionSet.jobTitle);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [answers, searchTerm, filterType, filterLevel, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedAnswers.length / itemsPerPage);
  const paginatedAnswers = filteredAndSortedAnswers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Enhanced statistics
  const stats = useMemo(() => {
    const answersWithScores = answers.filter(a => a.overallScore !== undefined);
    
    return {
      totalAnswers: answers.length,
      averageScore: answersWithScores.length > 0 ? 
        answersWithScores.reduce((sum, a) => sum + (a.overallScore || 0), 0) / answersWithScores.length : 0,
      technicalCount: answers.filter(a => a.jdQuestionSet.questionType === 'technical').length,
      behavioralCount: answers.filter(a => a.jdQuestionSet.questionType === 'behavioral').length,
      totalTimeSpent: answers.reduce((sum, a) => sum + (a.timeSpent || 0), 0),
      highScoreCount: answersWithScores.filter(a => (a.overallScore || 0) >= 80).length,
      recentActivity: answers.filter(a => {
        const daysSinceAnswer = (Date.now() - a.answeredAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceAnswer <= 7;
      }).length,
      improvementTrend: calculateImprovementTrend(answersWithScores),
    };
  }, [answers]);

  function calculateImprovementTrend(answersWithScores: JdAnswer[]) {
    if (answersWithScores.length < 2) return 0;
    
    const sorted = [...answersWithScores].sort((a, b) => a.answeredAt.getTime() - b.answeredAt.getTime());
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, a) => sum + (a.overallScore || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, a) => sum + (a.overallScore || 0), 0) / secondHalf.length;
    
    return secondAvg - firstAvg;
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-emerald-50 border-emerald-200';
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-yellow-50 border-yellow-200';
    if (score >= 60) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Job Title', 'Question Type', 'Level', 'Question', 'Score', 'Time Spent'],
      ...filteredAndSortedAnswers.map(answer => [
        formatDate(answer.answeredAt),
        answer.jdQuestionSet.jobTitle,
        answer.jdQuestionSet.questionType,
        answer.jdQuestionSet.level,
        answer.questionText,
        answer.overallScore?.toFixed(1) || 'N/A',
        answer.timeSpent ? formatDuration(answer.timeSpent) : 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jd-interview-history.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-4"></div>
            <div className="h-12 w-96 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          
          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-6 w-24 bg-gray-200 rounded"></div>
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                </div>
                <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>

          {/* Content Skeleton */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="h-6 w-40 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-6 border border-gray-200 rounded-lg animate-pulse">
                  <div className="h-5 w-48 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <History className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Interview History
            </h1>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button 
              onClick={loadAnswerHistory}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <History className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Interview History
            </h1>
            <p className="text-gray-600 mt-1">Track your progress and review past performance</p>
          </div>
        </div>

        {/* Enhanced Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-700">{stats.totalAnswers}</p>
                  <p className="text-sm text-blue-600">Total Answers</p>
                </div>
              </div>
              <div className="h-1 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>
                    {stats.averageScore.toFixed(1)}%
                  </p>
                  <p className="text-sm text-emerald-600">Average Score</p>
                </div>
              </div>
              <div className="h-1 bg-emerald-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(stats.averageScore, 100)}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow-md">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-amber-700">{stats.highScoreCount}</p>
                  <p className="text-sm text-amber-600">High Scores</p>
                </div>
              </div>
              <p className="text-xs text-amber-600 text-right">80%+ Performance</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-700">{stats.recentActivity}</p>
                  <p className="text-sm text-purple-600">This Week</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-purple-600">
                <TrendingUp className={`w-3 h-3 ${stats.improvementTrend >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                <span className={stats.improvementTrend >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {stats.improvementTrend >= 0 ? '+' : ''}{stats.improvementTrend.toFixed(1)}% trend
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Search and Filters */}
        <Card className="mb-6 shadow-sm hover:shadow-md transition-shadow duration-200 border-gray-200/60 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Advanced Search */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search interviews, questions, or answers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200"
                />
              </div>
              
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl border transition-all duration-200 ${
                  showFilters 
                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as 'all' | 'technical' | 'behavioral')}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                    >
                      <option value="all">All Types</option>
                      <option value="technical">Technical</option>
                      <option value="behavioral">Behavioral</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                    <select
                      value={filterLevel}
                      onChange={(e) => setFilterLevel(e.target.value as 'all' | 'entry' | 'mid' | 'senior')}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                    >
                      <option value="all">All Levels</option>
                      <option value="entry">Entry Level</option>
                      <option value="mid">Mid Level</option>
                      <option value="senior">Senior Level</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'date' | 'score' | 'jobTitle')}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                    >
                      <option value="date">Date</option>
                      <option value="score">Score</option>
                      <option value="jobTitle">Job Title</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                    >
                      <option value="desc">Newest First</option>
                      <option value="asc">Oldest First</option>
                    </select>
                  </div>
                </div>

                {/* Clear Filters */}
                {(searchTerm || filterType !== 'all' || filterLevel !== 'all') && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFilterType('all');
                        setFilterLevel('all');
                        setSortBy('date');
                        setSortOrder('desc');
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Answer History */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border-gray-200/60 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                Interview Sessions ({filteredAndSortedAnswers.length})
              </h2>
            </div>
            
            {filteredAndSortedAnswers.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {answers.length === 0 ? 'No Interview History Yet' : 'No Results Found'}
                </h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  {answers.length === 0 
                    ? "Start your interview journey today. Practice with AI-powered questions tailored to your target role."
                    : "Try adjusting your search criteria or filters to find what you're looking for."
                  }
                </p>
                {answers.length === 0 && (
                  <Link 
                    href="/jd" 
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Sparkles className="w-5 h-5" />
                    Start Interview Practice
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {paginatedAnswers.map((answer) => (
                    <div
                      key={answer.id}
                      className="group relative bg-white/90 border border-gray-200/50 rounded-xl p-6 hover:shadow-lg hover:border-blue-200/60 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-sm"
                      onClick={() => openDetailModal(answer)}
                    >
                      {/* Background Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Content */}
                      <div className="relative z-10">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">
                                {answer.jdQuestionSet.jobTitle}
                              </h3>
                              {answer.overallScore && answer.overallScore >= 90 && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-500" />
                                  <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                                    Excellent
                                  </span>
                                </div>
                              )}
                              {answer.overallScore && answer.overallScore >= 80 && answer.overallScore < 90 && (
                                <Trophy className="w-4 h-4 text-amber-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(answer.answeredAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Timer className="w-3 h-3" />
                                {answer.timeSpent ? formatDuration(answer.timeSpent) : 'N/A'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Score Badge */}
                          {answer.overallScore !== undefined && (
                            <div className={`px-3 py-2 rounded-lg border-2 ${getScoreBg(answer.overallScore)}`}>
                              <span className={`text-lg font-bold ${getScoreColor(answer.overallScore)}`}>
                                {answer.overallScore.toFixed(0)}%
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        <div className="flex items-center gap-2 mb-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            answer.jdQuestionSet.questionType === 'technical' 
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : answer.jdQuestionSet.questionType === 'behavioral'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-purple-100 text-purple-800 border border-purple-200'
                          }`}>
                            <Brain className="w-3 h-3 inline mr-1" />
                            {answer.jdQuestionSet.questionType}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            answer.jdQuestionSet.level === 'entry' 
                              ? 'bg-gray-100 text-gray-800 border border-gray-200'
                              : answer.jdQuestionSet.level === 'mid'
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            <Layers className="w-3 h-3 inline mr-1" />
                            {answer.jdQuestionSet.level}
                          </span>
                        </div>
                        
                        {/* Question Preview */}
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-2 font-medium">
                            Q{answer.questionIndex + 1}: {answer.questionText.length > 100 
                              ? answer.questionText.substring(0, 100) + '...' 
                              : answer.questionText}
                          </p>
                          <p className="text-sm text-gray-700 line-clamp-2 bg-gray-50 p-3 rounded-lg">
                            {answer.userAnswer.length > 120 
                              ? answer.userAnswer.substring(0, 120) + '...' 
                              : answer.userAnswer}
                          </p>
                        </div>
                        
                        {/* Strengths Preview */}
                        {answer.strengths && answer.strengths.length > 0 && (
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-2">
                              {answer.strengths.slice(0, 2).map((strength, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs flex items-center gap-1"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  {strength.length > 20 ? strength.substring(0, 20) + '...' : strength}
                                </span>
                              ))}
                              {answer.strengths.length > 2 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded-full text-xs">
                                  +{answer.strengths.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetailModal(answer);
                              }}
                              className="flex items-center gap-1 px-3 py-1 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-sm"
                            >
                              <Eye className="w-3 h-3" />
                              View Details
                            </button>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAnswer(answer.id);
                            }}
                            disabled={deleteLoading === answer.id}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            {deleteLoading === answer.id ? (
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Enhanced Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-blue-50/40 rounded-xl p-4 border border-gray-200/50 backdrop-blur-sm">
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredAndSortedAnswers.length)}</span> of{' '}
                      <span className="font-medium">{filteredAndSortedAnswers.length}</span> results
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm border border-gray-300/60 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/80 transition-colors flex items-center gap-1 backdrop-blur-sm"
                      >
                        <ChevronRight className="w-3 h-3 rotate-180" />
                        Previous
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                          const pageNum = i + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : 'border border-gray-300/60 hover:bg-white/80 backdrop-blur-sm'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        {totalPages > 5 && (
                          <>
                            <span className="px-2 text-gray-400">...</span>
                            <button
                              onClick={() => setCurrentPage(totalPages)}
                              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                                currentPage === totalPages
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : 'border border-gray-300/60 hover:bg-white/80 backdrop-blur-sm'
                              }`}
                            >
                              {totalPages}
                            </button>
                          </>
                        )}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm border border-gray-300/60 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/80 transition-colors flex items-center gap-1 backdrop-blur-sm"
                      >
                        Next
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Detail Modal */}
        {showDetailModal && selectedAnswer && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedAnswer.jdQuestionSet.jobTitle}
                      </h2>
                      {selectedAnswer.overallScore && selectedAnswer.overallScore >= 90 && (
                        <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 border border-yellow-200 rounded-full">
                          <Star className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-700">Excellent</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(selectedAnswer.answeredAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Timer className="w-4 h-4" />
                        {selectedAnswer.timeSpent ? formatDuration(selectedAnswer.timeSpent) : 'N/A'}
                      </span>
                      {selectedAnswer.overallScore !== undefined && (
                        <div className={`px-4 py-2 rounded-lg ${getScoreBg(selectedAnswer.overallScore)}`}>
                          <span className={`text-lg font-bold ${getScoreColor(selectedAnswer.overallScore)}`}>
                            {selectedAnswer.overallScore.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-8">
                {/* Question Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">Q</span>
                    </div>
                    <h3 className="font-semibold text-blue-900">Question {selectedAnswer.questionIndex + 1}</h3>
                  </div>
                  <p className="text-gray-800 leading-relaxed">
                    {selectedAnswer.questionText}
                  </p>
                </div>

                {/* Answer Section */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">A</span>
                    </div>
                    <h3 className="font-semibold text-emerald-900">Your Response</h3>
                  </div>
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {selectedAnswer.userAnswer}
                  </p>
                </div>

                {/* Feedback Section */}
                {selectedAnswer.feedback && (
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
                        <Settings className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-semibold text-amber-900">AI Feedback</h3>
                    </div>
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {selectedAnswer.feedback}
                    </p>
                  </div>
                )}

                {/* Detailed Scores */}
                {selectedAnswer.scores && Object.keys(selectedAnswer.scores).length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Performance Breakdown</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(selectedAnswer.scores).map(([criterion, score]) => (
                        <div key={criterion} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <p className="font-medium text-gray-900 capitalize mb-2">{criterion}</p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(score, 100)}%` }}
                              ></div>
                            </div>
                            <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                              {score.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths and Improvements */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Strengths */}
                  {selectedAnswer.strengths && selectedAnswer.strengths.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-semibold text-green-900">Key Strengths</h3>
                      </div>
                      <div className="space-y-2">
                        {selectedAnswer.strengths.map((strength, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-green-200 rounded-lg"
                          >
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-gray-800 text-sm">{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Improvements */}
                  {selectedAnswer.improvements && selectedAnswer.improvements.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-semibold text-orange-900">Growth Areas</h3>
                      </div>
                      <div className="space-y-2">
                        {selectedAnswer.improvements.map((improvement, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-orange-200 rounded-lg"
                          >
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="text-gray-800 text-sm">{improvement}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-2xl">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleDeleteAnswer(selectedAnswer.id)}
                    disabled={deleteLoading === selectedAnswer.id}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {deleteLoading === selectedAnswer.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete Answer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal for Delete */}
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={cancelDelete}
          onConfirm={confirmDeleteAnswer}
          title="Delete Answer"
          message="Are you sure you want to delete this answer? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      </div>
    </div>
  );
}