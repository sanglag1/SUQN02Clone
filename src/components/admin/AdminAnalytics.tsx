import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity,
  Target,
  Clock,
  Star,
  BarChart3,
  Download,
  RefreshCw,
  FileText
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    userGrowthRate: number;
    platformEngagement: number;
  };
  activityStats: {
    totalInterviews: number;
    totalQuizzes: number;
    totalTests: number;
    totalEQs: number;
    totalJDs: number;
    totalPractice: number;
    recentInterviews: number;
    recentQuizzes: number;
    recentTests: number;
    recentEQs: number;
    recentJDs: number;
    recentPractice: number;
  };
  engagementMetrics: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
  };
  learningStats: {
    totalStudyTime: number;
    averageStreak: number;
    totalGoals: number;
    completedGoals: number;
    averageGoalsPerUser: number;
  };
  skillDistribution: Array<{
    name: string;
    userCount: number;
    averageScore: number;
    levelDistribution: {
      beginner: number;
      intermediate: number;
      advanced: number;
      expert: number;
    };
  }>;
  activityTrends: Array<{
    date: string;
    interviews: number;
    quizzes: number;
    tests: number;
    eqs: number;
    jds: number;
    practice: number;
    total: number;
    averageScore: number;
  }>;
  topPerformers: Array<{
    userId: string;
    userName: string;
    email: string;
    averageScore: number;
    totalActivities: number;
    studyStreak: number;
    totalStudyTime: number;
  }>;
  mostActiveUsers: Array<{
    userId: string;
    userName: string;
    email: string;
    totalActivities: number;
    recentActivities: number;
    studyStreak: number;
  }>;
  goalInsights: Record<string, unknown>;
  recentActivities: Array<{
    type: string;
    score: number;
    timestamp: string;
    duration: number;
    userId: string;
    userName: string;
    userEmail: string;
    referenceId?: string; // Add referenceId for JD activity detection
    details: Record<string, unknown>;
  }>;
  timeframe: {
    days: number;
    startDate: string;
    endDate: string;
  };
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [includeCharts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Pagination for Top Performers
  const [tpPage, setTpPage] = useState(1);
  const [tpPageSize] = useState(5);
  // Pagination for Recent Activities
  const [raPage, setRaPage] = useState(1);
  const [raPageSize] = useState(5);

  // Keep RA page in range when data length changes
  useEffect(() => {
    const len = data?.recentActivities?.length || 0;
    const totalPages = Math.max(1, Math.ceil(len / raPageSize));
    if (raPage > totalPages) {
      setRaPage(totalPages);
    }
  }, [data?.recentActivities?.length, raPage, raPageSize]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        timeframe: timeRange,
        charts: includeCharts.toString(),
        recentLimit: '0',
        topLimit: '0'
      });

      const response = await fetch(`/api/admin/user-activities/analytics?${params}`);
      const result = await response.json();

      if (response.ok) {
        setData(result);
      } else {
        console.error('Error fetching analytics:', result.error);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, includeCharts]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };



  const formatNumber = (num: number) => {
    const safeNum = safeNumber(num);
    if (safeNum >= 1000000) {
      return (safeNum / 1000000).toFixed(1) + 'M';
    } else if (safeNum >= 1000) {
      return (safeNum / 1000).toFixed(1) + 'K';
    }
    return safeNum.toString();
  };

  const safeNumber = (value: unknown, defaultValue: number = 0): number => {
    const num = Number(value);
    return isNaN(num) || !isFinite(num) ? defaultValue : num;
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load analytics data.</p>
        <Button onClick={handleRefresh} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
      
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Activity Breakdown */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Activity Breakdown
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full">
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(data.activityStats.totalInterviews)}</p>
            <p className="text-sm text-gray-600">Interviews</p>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(safeNumber((data.activityStats.totalInterviews / Math.max(data.activityStats.totalInterviews + data.activityStats.totalQuizzes + data.activityStats.totalTests + data.activityStats.totalJDs, 1)) * 100))}% of total
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full">
              <Star className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(data.activityStats.totalQuizzes)}</p>
            <p className="text-sm text-gray-600">Quizzes</p>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(safeNumber((data.activityStats.totalQuizzes / Math.max(data.activityStats.totalInterviews + data.activityStats.totalQuizzes + data.activityStats.totalTests + data.activityStats.totalJDs, 1)) * 100))}% of total
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
              <Target className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(data.activityStats.totalTests)}</p>
            <p className="text-sm text-gray-600">Assessment Mode</p>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(safeNumber((data.activityStats.totalTests / Math.max(data.activityStats.totalInterviews + data.activityStats.totalQuizzes + data.activityStats.totalTests + data.activityStats.totalJDs, 1)) * 100))}% of total
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full">
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(data.activityStats.totalJDs)}</p>
            <p className="text-sm text-gray-600">JD Analysis</p>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(safeNumber((data.activityStats.totalJDs / Math.max(data.activityStats.totalInterviews + data.activityStats.totalQuizzes + data.activityStats.totalTests + data.activityStats.totalJDs, 1)) * 100))}% of total
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Skills */}

      </div>

  

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activities
          </h3>
          <Button variant="outline" size="sm" onClick={async () => { await handleRefresh(); setRaPage(1); }}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
        <div className="space-y-4">
          {(() => {
            const sorted = [...(data.recentActivities || [])]
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            const total = sorted.length;
            const totalPages = Math.max(1, Math.ceil(total / raPageSize));
            const currentPage = Math.min(raPage, totalPages);
            const start = (currentPage - 1) * raPageSize;
            const end = start + raPageSize;
            const pageItems = sorted.slice(start, end);
            return (
              <>
                {pageItems.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          activity.type === 'jd' ? 'default' :
                          activity.type === 'interview' ? 'default' :
                          activity.type === 'quiz' ? 'secondary' : 'outline'
                        }>
                          {activity.type === 'jd' ? 'JD Practice' : activity.type}
                        </Badge>
                        <span className="font-medium text-gray-900">{activity.userName}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{activity.userEmail}</p>
                    </div>
                    <div className="text-right">
                      {activity.type === 'jd' ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                            Completed
                          </Badge>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg text-gray-900">
                            {safeNumber(activity.score)}/10
                          </span>
                          <Badge variant={safeNumber(activity.score) >= 7 ? 'default' : safeNumber(activity.score) >= 5 ? 'secondary' : 'destructive'}>
                            {safeNumber(activity.score) >= 7 ? 'Good' : safeNumber(activity.score) >= 5 ? 'Average' : 'Needs Work'}
                          </Badge>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleDateString()} • {activity.duration}min
                      </p>
                    </div>
                  </div>
                ))}
                {(!data.recentActivities || data.recentActivities.length === 0) && (
                  <p className="text-center text-gray-500 py-4">No recent activities found</p>
                )}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Page {currentPage} of {totalPages} • {total} activities</span>
                  <div className="flex gap-2">
                    <button
                      className={`px-3 py-1.5 rounded-lg text-sm border ${currentPage === 1 ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                      onClick={() => currentPage > 1 && setRaPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                    >
                      Prev
                    </button>
                    <button
                      className={`px-3 py-1.5 rounded-lg text-sm border ${currentPage === totalPages ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                      onClick={() => currentPage < totalPages && setRaPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      aria-label="Next page"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Star className="h-5 w-5" />
            Top Performers
          </h3>
        </div>
        <div className="space-y-4">
          {(() => {
            const sorted = [...(data.topPerformers || [])]
              .filter(p => safeNumber(p.totalActivities) > 0)
              .sort((a, b) => {
                const byActivities = (b.totalActivities || 0) - (a.totalActivities || 0);
                if (byActivities !== 0) return byActivities;
                return (b.studyStreak || 0) - (a.studyStreak || 0);
              });
            const total = sorted.length;
            const totalPages = Math.max(1, Math.ceil(total / tpPageSize));
            const currentPage = Math.min(tpPage, totalPages);
            const start = (currentPage - 1) * tpPageSize;
            const end = start + tpPageSize;
            const pageItems = sorted.slice(start, end);
            return (
              <>
                {pageItems.map((performer, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {performer.userName || 'Unknown User'}
                </p>
                <p className="text-sm text-gray-500">{performer.email}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{performer.totalActivities} activities</p>
                <p className="text-sm text-gray-500">{performer.studyStreak} day streak</p>
              </div>
            </div>
                ))}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Page {currentPage} of {totalPages} • {total} users</span>
                  <div className="flex gap-2">
                    <button
                      className={`px-3 py-1.5 rounded-lg text-sm border ${currentPage === 1 ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                      onClick={() => currentPage > 1 && setTpPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                    >
                      Prev
                    </button>
                    <button
                      className={`px-3 py-1.5 rounded-lg text-sm border ${currentPage === totalPages ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                      onClick={() => currentPage < totalPages && setTpPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      aria-label="Next page"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
