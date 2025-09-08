"use client";

import { 
  Brain, FileText,
  TestTube, FileQuestion, TrendingUp,
  Clock, Award, Users, Target, Home, BookOpen, Calendar, Settings
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePet } from '@/hooks/usePet';
import { PetDisplay } from '@/components/pet/PetDisplay';
import { getPetEvolutionStages } from '@/utils/petLogic';
import { ChartRadarLinesOnly } from '@/components/ui/chart-radar-lines-only';
import { ChartMultiAreaInteractive } from '@/components/ui/chart-multi-area-interactive';
import MagicDock from '@/components/ui/magicdock';
import { useRouter } from 'next/navigation';

interface SkillProgress {
  name: string;
  level: string;
  score: number;
  progress: Array<{
    date: Date;
    score: number;
  }>;
}

interface ProgressData {
  stats: {
    totalInterviews: number;
    averageScore: number;
    studyStreak: number;
    totalStudyTime: number;
  };
  skillProgress: SkillProgress[];
  currentFocus: string[];
  nextMilestones: Array<{
    goal: string;
    targetDate: Date;
  }>;
  recommendations: string[];
  recentActivities?: Array<{
    type: string;
    score?: number;
    duration?: number;
    timestamp?: string | Date;
  }>;
  allActivities?: Array<{
    type: string;
    score?: number;
    duration?: number;
    timestamp?: string | Date;
  }>;
  allQuizActivities?: Array<{
    type: string;
    score?: number;
    duration?: number;
    timestamp?: string | Date;
  }>;
}

export default function DashboardPage() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  // User navigation items for MagicDock
  const userDockItems = [
    {
      id: 1,
      icon: <Home className="w-6 h-6 text-white" />,
      label: "Dashboard",
      description: "Main overview",
      onClick: () => router.push("/dashboard")
    },
    {
      id: 2,
      icon: <BookOpen className="w-6 h-6 text-white" />,
      label: "Review Question",
      description: "Question Bank",
      onClick: () => router.push("/review")
    },
    {
      id: 3,
      icon: <Calendar className="w-6 h-6 text-white" />,
      label: "Practice",
      description: "AI Bot",
      onClick: () => router.push("/avatar-interview")
    },
    {
      id: 4,
      icon: <Settings className="w-6 h-6 text-white" />,
      label: "Profile",
      description: "Account settings",
      onClick: () => router.push("/profile")
    }
  ];

  // Multi-Line Chart State
  const [viewMode, setViewMode] = useState<'day' | 'month' | 'year'>('day');
  const [lineMode, setLineMode] = useState<'score' | 'total'>('score');
  const [lineChartData, setLineChartData] = useState<Array<{
    period: string;
    quiz: number;
    test: number;
    interview: number;
  }>>([]);

  // Spider chart data state
  const [overallSpiderData, setOverallSpiderData] = useState<Array<{
    subject: string;
    A: number;
    fullMark: number;
    target: number;
    unit: string;
  }>>([]);
  const [showTargetModal, setShowTargetModal] = useState(false);
  type PersonalTargets = {
    totalActivities: number;
    averageScore: number;
    studyTime: number;
    completionRate: number;
    learningFrequency: number;
  };
  const defaultTargets: PersonalTargets = {
    totalActivities: 50,
    averageScore: 80,
    studyTime: 200,
    completionRate: 90,
    learningFrequency: 15,
  };
  const [personalTargets, setPersonalTargets] = useState<PersonalTargets>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('personalTargets');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return defaultTargets;
  });

  // --- STREAK FEATURE STATE & LOGIC ---
  const [showStreakModal, setShowStreakModal] = useState(false);
  // Lấy số ngày streak thực tế từ progress.stats.studyStreak
  const currentStreak = progress?.stats?.studyStreak || 0;
  const totalActivities = progress?.allActivities?.length || 0;

  // Sử dụng usePet hook thay vì logic cũ
  const petData = usePet({ totalActivities, currentStreak });

  const streakData = {
    currentStreak,
    milestones: {
      achieved: [3, 10, 30, 50, 100].filter(m => currentStreak >= m),
      next: 0,
    },
    pet: {
      name: petData.name,
      level: petData.level,
      happiness: petData.happinessPercentage,
      evolution: petData.evolution,
      isAlive: petData.isAlive,
    },
  };
  const getStreakBadge = (streak: number) => {
    if (streak >= 100) return { emoji: '🔥', color: 'bg-yellow-400', text: 'text-yellow-900' };
    if (streak >= 50) return { emoji: '🔥', color: 'bg-purple-500', text: 'text-white' };
    if (streak >= 30) return { emoji: '🔥', color: 'bg-blue-500', text: 'text-white' };
    if (streak >= 14) return { emoji: '🔥', color: 'bg-orange-500', text: 'text-white' };
    if (streak >= 7) return { emoji: '🔥', color: 'bg-green-500', text: 'text-white' };
    return { emoji: '🔥', color: 'bg-gray-300', text: 'text-gray-600' };
  };
  const getMilestoneColor = (milestone: number) => {
    switch (milestone) {
      case 3: return 'bg-green-500 text-white';
      case 10: return 'bg-orange-500 text-white';
      case 30: return 'bg-blue-500 text-white';
      case 50: return 'bg-purple-500 text-white';
      case 100: return 'bg-yellow-400 text-yellow-900';
      default: return 'bg-gray-300 text-gray-600';
    }
  };

  const getStreakGradient = (streak: number) => {
    if (streak >= 100) return 'from-yellow-400 via-yellow-500 to-orange-500';
    if (streak >= 50) return 'from-purple-500 via-purple-600 to-pink-500';
    if (streak >= 30) return 'from-blue-500 via-blue-600 to-indigo-500';
    if (streak >= 10) return 'from-orange-500 via-red-500 to-pink-500';
    if (streak >= 3) return 'from-green-500 via-green-600 to-teal-500';
    return 'from-gray-400 via-gray-500 to-gray-600';
  };


  useEffect(() => {
    const fetchProgress = async () => {
      if (!isLoaded || !user) return;
      
            try {
        const response = await fetch('/api/tracking');
        if (response.ok) {
          const data = await response.json();
        
        // API trả về data trực tiếp, không có .progress
        setProgress(data);
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchProgress, 30000);
    return () => clearInterval(interval);
  }, [isLoaded, user]);


  useEffect(() => {
    if (!progress) return;
    
    // Sử dụng allActivities thay vì recentActivities để có đầy đủ dữ liệu
    const activities = progress.allActivities || progress.recentActivities || [];
    


    
    const groupKey = (date: Date): string => {
      if (viewMode === 'day') return date.toISOString().slice(0, 10);
      if (viewMode === 'month') return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
      if (viewMode === 'year') return String(date.getFullYear());
      return '';
    };
    const grouped: Record<string, { quiz: number[]; test: number[]; interview: number[] }> = {};
    activities.forEach(a => {
      if (!a.timestamp) return;
      const date = new Date(a.timestamp);
      const key = groupKey(date);
      if (!key) return;
      if (!grouped[key]) grouped[key] = { quiz: [], test: [], interview: [] };
      if (a.type === 'quiz') grouped[key].quiz.push(a.score || 0);
      if (a.type === 'test' || a.type === 'eq') grouped[key].test.push(a.score || 0);
      if (a.type === 'interview') grouped[key].interview.push(a.score || 0);
    });
    
    const chartData = Object.entries(grouped).map(([period, vals]) => {
      if (lineMode === 'score') {
        return {
          period,
          quiz: vals.quiz.length ? (vals.quiz.reduce((a, b) => a + b, 0) / vals.quiz.length) : 0,
          test: vals.test.length ? (vals.test.reduce((a, b) => a + b, 0) / vals.test.length) : 0,
          interview: vals.interview.length ? (vals.interview.reduce((a, b) => a + b, 0) / vals.interview.length) : 0,
        };
      } else {
        // Sử dụng số lượng thực tế từ allActivities
        return {
          period,
          quiz: vals.quiz.length,
          test: vals.test.length,
          interview: vals.interview.length,
        };
      }
    }).sort((a, b) => a.period.localeCompare(b.period));


    setLineChartData(chartData);
  }, [progress, viewMode, lineMode]);

  // Tính toán dữ liệu spider chart mỗi khi progress thay đổi
  useEffect(() => {
    if (!progress) return;
    
    // Sử dụng totalActivities để tính tổng số activities
    const totalCount = totalActivities;
    const avgScore = progress.stats?.averageScore || 0;
    // Study time chuyển sang giờ, làm tròn 1 số thập phân
    const totalStudyTimeRaw = progress.stats?.totalStudyTime || 0;
    const totalStudyTime = +(totalStudyTimeRaw / 60).toFixed(1); // giờ
    
    // Tính completion rate và frequency từ recentActivities nếu có
    let completionRate = 0;
    let frequency = 0;
    
    if (progress.recentActivities && progress.recentActivities.length > 0) {
      const activities = progress.recentActivities;
      completionRate = activities.filter(a => a.score !== undefined).length / activities.length * 100;
      
      // Tần suất học: số lần trong 30 ngày gần nhất
      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      frequency = activities.filter(a => new Date(a.timestamp || '') > oneMonthAgo).length;
    }
    setOverallSpiderData([
      {
        subject: 'Total Activities', A: Math.min(totalCount, 100), fullMark: 100, target: personalTargets.totalActivities, unit: 'times'
      },
      {
        subject: 'Average Score', A: Math.round(avgScore), fullMark: 100, target: personalTargets.averageScore, unit: ''
      },
      {
        subject: 'Study Time', A: Math.min(totalStudyTime, 10), fullMark: 10, target: personalTargets.studyTime, unit: 'h'
      },
      {
        subject: 'Completion Rate', A: Math.round(completionRate), fullMark: 100, target: personalTargets.completionRate, unit: '%'
      },
      {
        subject: 'Learning Frequency', A: Math.min(frequency, 20), fullMark: 20, target: personalTargets.learningFrequency, unit: 'times/month'
      },
    ]);
  }, [progress, personalTargets, totalActivities]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header + Hero Section ngang hàng */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here&apos;s an overview of your interview activities.</p>
          </div>
          {/* Study Streak Hero Section */}
          <div className={`bg-gradient-to-r ${getStreakGradient(currentStreak)} rounded-xl text-white relative overflow-hidden flex items-center justify-between p-3 max-w-[480px] w-full lg:w-auto lg:min-w-[380px]`}>
            {/* Streak bên trái */}
            <div className="flex flex-col items-center justify-center px-2">
              <div className={`text-3xl mb-1 ${getStreakBadge(currentStreak).color} ${getStreakBadge(currentStreak).text} rounded-full p-1.5 shadow-md`}>
                {getStreakBadge(currentStreak).emoji}
              </div>
              <div className="text-sm font-bold mb-1">{currentStreak} streak days</div>
              <div className="flex gap-1 flex-wrap justify-center">
                {[3, 10, 30, 50, 100].map((milestone) => (
                  <div
                    key={milestone}
                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium shadow-sm ${getMilestoneColor(milestone)} ${currentStreak >= milestone ? 'ring-1 ring-white' : 'opacity-50'}`}
                  >
                    <span className="text-xs">🔥</span>
                    <span>{milestone}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Pet bên phải - sử dụng component mới */}
            <PetDisplay
              totalActivities={totalActivities}
              currentStreak={currentStreak}
              onShowDetails={() => setShowStreakModal(true)}
              compact={true}
            />
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">              <div>
                <p className="text-sm text-gray-600 mb-1">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : totalActivities}
                </p>
                <p className="text-sm text-green-600">Recent activities</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">              <div>
                <p className="text-sm text-gray-600 mb-1">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : progress?.stats?.averageScore ? progress.stats.averageScore.toFixed(1) : '0.0'}
                </p>
                <p className="text-sm text-green-600">Overall performance</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">              <div>
                <p className="text-sm text-gray-600 mb-1">Study Streak</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : streakData.currentStreak}
                </p>
                <p className="text-sm text-green-600">Consecutive days</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">              <div>
                <p className="text-sm text-gray-600 mb-1">Study Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : progress?.stats?.totalStudyTime ? (progress.stats.totalStudyTime / 60).toFixed(1) + 'h' : '0h'}
                </p>
                <p className="text-sm text-green-600">Total minutes</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Line Chart + Spider Chart */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Multi-Line Chart - Left */}
          <div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 lg:mb-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Progress by {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} ({lineMode === 'score' ? 'Average Score' : 'Total Count'})</h2>
                <div className="flex items-center gap-4">
                  <span className="font-medium">View by:</span>
                  <select
                    className="border rounded px-2 py-1"
                    value={viewMode}
                    onChange={e => setViewMode(e.target.value as 'day' | 'month' | 'year')}
                  >
                    <option value="day">Day</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                  </select>
                  <span className="font-medium ml-6">Mode:</span>
                  <select
                    className="border rounded px-2 py-1"
                    value={lineMode}
                    onChange={e => setLineMode(e.target.value as 'score' | 'total')}
                  >
                    <option value="score">Score</option>
                    <option value="total">Total</option>
                  </select>
                </div>
              </div>
              <ChartMultiAreaInteractive
                data={lineChartData.map(d => ({
                  // map period -> date to keep X axis formatter compatible
                  date: d.period,
                  quiz: d.quiz,
                  test: d.test,
                  interview: d.interview,
                }))}
                height={288}
                title=""
                description=""
                hideCard={true}
              />
            </div>
          </div>
          {/* Spider Chart - Right */}
          <div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Overall Progress</h2>
                <Button 
                  onClick={() => setShowTargetModal(true)}
                  className="flex items-center gap-2"
                >
                  <Target className="w-4 h-4" />
                  Set Targets
                </Button>
              </div>
              <div className="h-72">
                <ChartRadarLinesOnly 
                  data={overallSpiderData.map(item => ({
                    month: item.subject,
                    desktop: item.A,
                    mobile: item.target
                  }))}
                  title=""
                  description=""
                  showTargets={true}
                  hideCard={true}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Quick Actions */}
          <div className="space-y-6">            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <p className="text-sm text-gray-600 mb-6">Frequently used features</p>
              
              <div className="grid grid-cols-2 gap-4">
                <Link href="/avatar-interview" 
                  className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <Brain className="w-6 h-6 text-blue-600" />
                  </div>                  <span className="text-sm font-medium text-gray-900 text-center">AI Avatar Interview</span>
                  <span className="text-xs text-gray-500 mt-1">Interview with AI Avatar</span>
                  <button className="mt-3 px-4 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors">
                    Start Now
                  </button>
                </Link>

                <Link href="/quiz" 
                  className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-pink-500 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-3">
                    <FileQuestion className="w-6 h-6 text-pink-600" />
                  </div>                  <span className="text-sm font-medium text-gray-900 text-center">Practice Quiz</span>
                  <span className="text-xs text-gray-500 mt-1">Learn technical concepts</span>
                  <button className="mt-3 px-4 py-2 bg-pink-600 text-white text-xs rounded-lg hover:bg-pink-700 transition-colors">
                    View Now
                  </button>
                </Link>

                <Link href="/test" 
                  className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-purple-500 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                    <TestTube className="w-6 h-6 text-purple-600" />
                  </div>                  <span className="text-sm font-medium text-gray-900 text-center">Assessment Mode</span>
                  <span className="text-xs text-gray-500 mt-1">Check your Test score</span>
                  <button className="mt-3 px-4 py-2 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors">
                    Take Test
                  </button>
                </Link>

                <Link href="/jd" 
                  className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-orange-500 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>                  <span className="text-sm font-medium text-gray-900 text-center">AI with JD</span>
                  <span className="text-xs text-gray-500 mt-1">Assess professional skills</span>
                  <button className="mt-3 px-4 py-2 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 transition-colors">
                    Get Started
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Progress */}
          <div className="space-y-6">            {/* Skills Progress */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Skills Progress</h3>
              <p className="text-sm text-gray-600 mb-6">Competency scores by skill area</p>
              
              {loading ? (
              <div className="space-y-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-2">
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                        <div className="h-2 bg-gray-200 rounded-full animate-pulse" style={{width: "60%"}}></div>
                      </div>
                  </div>
                  ))}
                </div>
              ) : progress?.skillProgress && progress.skillProgress.length > 0 ? (
                <div className="space-y-6">
                  {progress.skillProgress.map((skill) => (
                    <div key={skill.name}>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-gray-700">{skill.name}</span>
                        <span className="text-sm text-gray-500">{skill.level}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                        <div
                          className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${skill.score}%` }}
                        />
                      </div>
                      {skill.progress && skill.progress.length > 0 && (
                        <div className="mt-4 h-[100px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={skill.progress}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="date"
                                tickFormatter={(date) =>
                                  new Date(date).toLocaleDateString()
                                }
                              />
                              <YAxis domain={[0, 100]} />
                              <Tooltip
                                labelFormatter={(date) =>
                                  new Date(date).toLocaleDateString()
                                }
                              />
                              <Line
                                type="monotone"
                                dataKey="score"
                                stroke="#2563eb"
                                strokeWidth={2}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                  </div>
                  ))}
                </div>
              ) : progress?.stats ? (
                // Fallback: Hiển thị stats cơ bản nếu không có skillProgress
                <div className="space-y-4">
                <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-700">Overall Performance</span>
                      <span className="text-sm text-gray-500">Current</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                      <div
                        className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, progress.stats.averageScore)}%` }}
                      />
                  </div>
                    <p className="text-xs text-gray-500 mt-1">Average Score: {progress.stats.averageScore.toFixed(1)}%</p>
                </div>
                
                <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-700">Study Streak</span>
                      <span className="text-sm text-gray-500">{progress.stats.studyStreak} days</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                      <div
                        className="h-2 bg-green-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, progress.stats.studyStreak * 10)}%` }}
                      />
                  </div>
                </div>
                
                <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-700">Total Study Time</span>
                      <span className="text-sm text-gray-500">{progress.stats.totalStudyTime} min</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                      <div
                        className="h-2 bg-purple-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, progress.stats.totalStudyTime / 10)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No skill progress data available</p>
                  <p className="text-sm text-gray-400 mt-2">Complete some activities to see your progress</p>
                </div>
              )}
            </div>
          </div>
        </div>
     </div>
      {/* Target Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Set Overall Progress Targets</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowTargetModal(false)}>
                ✕
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalActivities">Total Activities</Label>
                <Input
                  id="totalActivities"
                  type="number"
                  min="0"
                  value={personalTargets.totalActivities}
                  onChange={(e) => setPersonalTargets((prev: PersonalTargets) => ({ ...prev, totalActivities: Math.max(0, parseInt(e.target.value) || 0) }))}
                />
              </div>
              <div>
                <Label htmlFor="averageScore">Average Score</Label>
                <Input
                  id="averageScore"
                  type="number"
                  min="0"
                  max="100"
                  value={personalTargets.averageScore}
                  onChange={(e) => setPersonalTargets((prev: PersonalTargets) => ({ ...prev, averageScore: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) }))}
                />
              </div>
              <div>
                <Label htmlFor="studyTime">Study Time (hours)</Label>
                <Input
                  id="studyTime"
                  type="number"
                  step="0.1"
                  min="0"
                  value={personalTargets.studyTime}
                  onChange={(e) => setPersonalTargets((prev: PersonalTargets) => ({ ...prev, studyTime: Math.max(0, parseFloat(e.target.value) || 0) }))}
                />
              </div>
              <div>
                <Label htmlFor="completionRate">Completion Rate (%)</Label>
                <Input
                  id="completionRate"
                  type="number"
                  min="0"
                  max="100"
                  value={personalTargets.completionRate}
                  onChange={(e) => setPersonalTargets((prev: PersonalTargets) => ({ ...prev, completionRate: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) }))}
                />
              </div>
              <div>
                <Label htmlFor="learningFrequency">Learning Frequency (times/month)</Label>
                <Input
                  id="learningFrequency"
                  type="number"
                  min="0"
                  value={personalTargets.learningFrequency}
                  onChange={(e) => setPersonalTargets((prev: PersonalTargets) => ({ ...prev, learningFrequency: Math.max(0, parseInt(e.target.value) || 0) }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowTargetModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  localStorage.setItem('personalTargets', JSON.stringify(personalTargets));
                  setShowTargetModal(false);
                }}
              >
                Save Targets
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Streak Detail Modal */}
      {showStreakModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Study Pet Details</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowStreakModal(false)}>
                ✕
              </Button>
            </div>
            <div className="text-center mb-6">
              <PetDisplay
                totalActivities={totalActivities}
                currentStreak={currentStreak}
                compact={false}
              />
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold mb-2">Pet Evolution Stages</h5>
                <div className="space-y-2">
                  {getPetEvolutionStages().map((evolution) => (
                    <div
                      key={evolution.stage}
                      className={`flex items-center gap-3 p-2 rounded ${
                        petData.evolution === evolution.stage ? 'bg-blue-100 border border-blue-300' : 'bg-white'
                      }`}
                    >
                      <span className="text-2xl">{evolution.emoji}</span>
                      <div className="flex-1">
                        <span className="font-medium">{evolution.name}</span>
                        <span className="text-sm text-gray-500 ml-2">Level {evolution.level}</span>
                        <div className="text-xs text-gray-400">{evolution.requirement}</div>
                      </div>
                      {petData.level >= evolution.level && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h5 className="font-semibold text-yellow-800 mb-2"> Important Notice</h5>
                <p className="text-sm text-yellow-700">
                  If you don&#39;t study for 2 consecutive days, your pet will disappear and you&#39;ll have to start over!
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={() => setShowStreakModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
      
      {/* User Navigation Dock */}
      <MagicDock 
        items={userDockItems}
        variant="tooltip"
        magnification={70}
        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
      />
    </DashboardLayout>
  );
}
