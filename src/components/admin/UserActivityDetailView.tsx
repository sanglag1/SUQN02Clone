import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft,
  Trophy,
  Clock,
  TrendingUp,
  Activity,
  Star,
  Book,
  Brain,
  CheckCircle,
  Circle,
  AlertCircle,
  FileText
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Activity = {
  id?: string;
  _id?: string;
  type: string;
  score?: number;
  duration: number;
  timestamp: string;
  referenceId?: string;
};

interface UserActivityDetail {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isOnline: boolean;
    lastActivity: string;
    clerkId: string;
  };
  stats: {
    totalActivities: number;
    byType: {
      interview: number;
      quiz: number;
      practice: number;
      learning: number;
      goalCompleted: number;
      goalStarted: number;
    };
    averageScore: number;
    totalDuration: number;
    bestScore: number;
    worstScore: number;
    averageDuration: number;
  };
  activities?: Activity[];
  skills: Array<{
    _id: string;
    name: string;
    level: string;
    score: number;
    lastAssessed: string;
  }>;
  goals: Array<{
    _id: string;
    title: string;
    description: string;
    status: 'pending' | 'in-progress' | 'in_progress' | 'not_started' | 'completed';
    type: string;
    targetDate: string;
    completedDate?: string;
  }> | {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
  };
  learningStats: {
    totalStudyTime: number;
    weeklyStudyTime: number;
    monthlyStudyTime: number;
    streak: number;
    lastStudyDate: string;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  dailyActivity: Record<string, {
    count: number;
    totalDuration: number;
    averageScore: number;
  }>;
  recentTimeline?: Activity[];
}

interface UserActivityDetailViewProps {
  userId: string;
  onBack: () => void;
}

export default function UserActivityDetailView({ userId, onBack }: UserActivityDetailViewProps) {
  const [data, setData] = useState<UserActivityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [activityType, setActivityType] = useState('all');

  // Helper function to check if activity is JD-related
  const isJdActivity = (activity: { type: string; referenceId?: string }) => {
    return activity.type === 'jd';
  };

  const fetchUserActivity = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        timeRange,
        activityType
      });

      const response = await fetch(`/api/admin/user-activities/${userId}?${params}`);
      const result = await response.json();
      if (response.ok) {
        setData(result);
      } else {
        console.error('Error fetching user activity:', result.error);
      }
    } catch (error) {
      console.error('Error fetching user activity:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, timeRange, activityType]);

  useEffect(() => {
    fetchUserActivity();
  }, [fetchUserActivity]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const safeNumber = (value: unknown, defaultValue: number = 0): number => {
    const num = Number(value);
    return isNaN(num) || !isFinite(num) ? defaultValue : num;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-red-100 text-red-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-blue-100 text-blue-800';
      case 'expert': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGoalStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-progress': return <Circle className="h-4 w-4 text-blue-600" />;
      case 'pending': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <Circle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'interview': return <Trophy className="h-4 w-4 text-purple-600" />;
      case 'quiz': return <Brain className="h-4 w-4 text-blue-600" />;
      case 'practice': return <Book className="h-4 w-4 text-green-600" />;
      case 'learning': return <Star className="h-4 w-4 text-yellow-600" />;
      case 'jd': return <FileText className="h-4 w-4 text-purple-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onBack}></div>
        <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onBack}></div>
        <div className="relative w-full max-w-xl max-h-[80vh] overflow-y-auto bg-white rounded-xl shadow-2xl p-6">
          <div className="text-center py-12">
            <p className="text-gray-500">User activity not found.</p>
            <Button variant="outline" onClick={onBack} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Normalize goals structure to avoid runtime errors
  const goalsArray = Array.isArray(data.goals) ? data.goals : [];
  const goalsSummary = Array.isArray(data.goals) ? null : data.goals;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onBack}></div>
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl p-6">
        <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {data.user.firstName} {data.user.lastName}
            </h1>
            <p className="text-gray-500">{data.user.email}</p>
          </div>
          <Badge className={data.user.isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            {data.user.isOnline ? 'Online' : 'Offline'}
          </Badge>
          {(typeof data.user.role === 'string' ? data.user.role : 'user') === 'admin' && (
            <Badge variant="secondary">Admin</Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={activityType} onValueChange={setActivityType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Activity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="interview">Interviews</SelectItem>
              <SelectItem value="quiz">Quizzes</SelectItem>
              <SelectItem value="practice">Practice</SelectItem>
              <SelectItem value="learning">Learning</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-blue-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Total Activities</p>
                <p className="text-2xl font-bold">{data.stats.totalActivities}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold">{Math.round(safeNumber(data.stats.averageScore))}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-green-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Study Time</p>
                <p className="text-2xl font-bold">{formatDuration(data.stats.totalDuration)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold">{data.learningStats.streak} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-sm text-gray-600">Interviews</p>
              <p className="text-lg font-bold">{data.stats.byType.interview}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Brain className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">Quizzes</p>
              <p className="text-lg font-bold">{data.stats.byType.quiz}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Book className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">Practice</p>
              <p className="text-lg font-bold">{data.stats.byType.practice}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <p className="text-sm text-gray-600">Learning</p>
              <p className="text-lg font-bold">{data.stats.byType.learning}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">Goals Completed</p>
              <p className="text-lg font-bold">{data.stats.byType.goalCompleted}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Circle className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">Goals Started</p>
              <p className="text-lg font-bold">{data.stats.byType.goalStarted}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Skills ({Array.isArray(data.skills) ? data.skills.length : 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(Array.isArray(data.skills) ? data.skills : []).slice(0, 10).map((skill) => (
                <div key={skill._id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{skill.name}</p>
                      <Badge className={getSkillLevelColor(skill.level)}>
                        {skill.level}
                      </Badge>
                    </div>
                    <Progress value={safeNumber(skill.score)} className="mt-2" />
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold">{safeNumber(skill.score)}%</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(skill.lastAssessed)}
                    </p>
                  </div>
                </div>
              ))}
              {(Array.isArray(data.skills) ? data.skills.length : 0) > 10 && (
                <p className="text-sm text-gray-500 text-center">
                  And {(Array.isArray(data.skills) ? data.skills.length : 0) - 10} more skills...
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Goals */}
        <Card>
          <CardHeader>
            <CardTitle>
              Goals {goalsSummary ? '' : `(${goalsArray.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!goalsSummary ? (
              <div className="space-y-4">
                {goalsArray.slice(0, 10).map((goal) => {
                  const status = (goal.status === 'in_progress' ? 'in-progress' : goal.status) as 'pending' | 'in-progress' | 'completed';
                  return (
                    <div key={goal._id} className="flex items-start gap-3">
                      {getGoalStatusIcon(status)}
                      <div className="flex-1">
                        <p className="font-medium">{goal.title}</p>
                        <p className="text-sm text-gray-600">{goal.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{goal.type}</Badge>
                          <Badge 
                            className={
                              status === 'completed' ? 'bg-green-100 text-green-800' :
                              status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Target: {formatDate(goal.targetDate)}
                          {goal.completedDate && ` • Completed: ${formatDate(goal.completedDate)}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {goalsArray.length > 10 && (
                  <p className="text-sm text-gray-500 text-center">
                    And {goalsArray.length - 10} more goals...
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Goals</span>
                  <span className="font-semibold">{goalsSummary.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completed</span>
                  <Badge className="bg-green-100 text-green-800">{goalsSummary.completed}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">In Progress</span>
                  <Badge className="bg-blue-100 text-blue-800">{goalsSummary.inProgress}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Not Started</span>
                  <Badge className="bg-yellow-100 text-yellow-800">{goalsSummary.notStarted}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(data.recentTimeline ?? data.activities ?? []).slice(0, 20).map((activity) => (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <div key={(activity as any).id ?? (activity as any)._id} className="flex items-center gap-4 p-3 border rounded-lg">
                {getActivityTypeIcon(activity.type)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium capitalize">
                      {(() => {
                        // Debug info
                        console.log('🔍 Processing activity:', activity);
                        return isJdActivity(activity) ? 'JD Practice' : activity.type;
                      })()}
                    </p>
                    {/* Show different badges for JD vs other activities */}
                    {isJdActivity(activity) ? (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        Completed
                      </Badge>
                    ) : (
                      activity.score && (
                        <Badge variant="outline">{safeNumber(activity.score)}%</Badge>
                      )
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Duration: {formatDuration(activity.duration)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

        {/* Insights */}
        {(((Array.isArray(data.strengths) ? data.strengths.length : 0) > 0) || ((Array.isArray(data.weaknesses) ? data.weaknesses.length : 0) > 0) || ((Array.isArray(data.recommendations) ? data.recommendations.length : 0) > 0)) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(Array.isArray(data.strengths) ? data.strengths.length : 0) > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(Array.isArray(data.strengths) ? data.strengths : []).map((strength, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <p className="text-sm">{strength}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
 
            {(Array.isArray(data.weaknesses) ? data.weaknesses.length : 0) > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Areas for Improvement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(Array.isArray(data.weaknesses) ? data.weaknesses : []).map((weakness, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <p className="text-sm">{weakness}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
 
            {(Array.isArray(data.recommendations) ? data.recommendations.length : 0) > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-600">Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(Array.isArray(data.recommendations) ? data.recommendations : []).map((recommendation, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-blue-600" />
                        <p className="text-sm">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
