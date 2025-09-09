

'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

interface ProgressStats {
  totalInterviews: number;
  averageScore: number;
  studyStreak: number;
  totalStudyTime: number;
}

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
  stats: ProgressStats;
  skillProgress: SkillProgress[];
  currentFocus: string[];
  nextMilestones: Array<{
    goal: string;
    targetDate: Date;
  }>;
  recommendations: string[];
  recentActivities?: Activity[];
  allActivities?: Activity[];
}

interface Activity {
  type: string;
  score?: number;
  duration?: number;
  timestamp?: string | Date;
  skillScores?: Record<string, number>;
}

interface SpiderChartData {
  subject: string;
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
  fullMark: number;
  target?: number; // Mục tiêu cá nhân
  unit?: string; // 'min', '%', 'points', 'times'
}

export default function TrackingDashboard() {
  const { isLoaded, user } = useUser();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [overallSpiderData, setOverallSpiderData] = useState<SpiderChartData[]>([]);
  const [improvement, setImprovement] = useState<{ current: number; previous: number; delta: number }>({ current: 0, previous: 0, delta: 0 });
  const [normalizedTrend, setNormalizedTrend] = useState<Array<{ date: string; overall: number }>>([]);
  const [dimensionRadarData, setDimensionRadarData] = useState<Array<{ subject: string; value: number }>>([]);
  const [modeBreakdown, setModeBreakdown] = useState<Record<string, number>>({});

  const [showTargetModal, setShowTargetModal] = useState(false);
  const [personalTargets, setPersonalTargets] = useState({
    totalActivities: 50,
    averageScore: 80,
    studyTime: 200,
    completionRate: 90,
    learningFrequency: 15,
    numberOfTests: 20,
    logicScore: 85,
    languageScore: 85,
    fundamentalScore: 85,
    testAverageTime: 25,
    numberOfInterviews: 10,
    technicalScore: 85,
    communicationScore: 85,
    problemSolvingScore: 85,
    interviewAverageTime: 60,
    numberOfQuizzes: 30,
    quizAverageScore: 85,
    quizAccuracyRate: 85,
    quizAverageTime: 20,
    quizFrequency: 10
  });
  const [viewMode, setViewMode] = useState<'day' | 'month' | 'year'>('day');
  const [lineMode, setLineMode] = useState<'score' | 'total'>('score');
  const [lineChartData, setLineChartData] = useState<Array<{ period: string; quiz: number; test: number; interview: number }>>([]);
  const [targetUpdateTrigger, setTargetUpdateTrigger] = useState(0);

  // Load personal targets from localStorage on mount
  useEffect(() => {
    const savedTargets = localStorage.getItem('personalTargets');
    if (savedTargets) {
      try {
        const parsedTargets = JSON.parse(savedTargets);
        setPersonalTargets(prev => ({ ...prev, ...parsedTargets }));
      } catch (error) {
        console.error('Error loading personal targets:', error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch('/api/tracking');
        if (!response.ok) {
          throw new Error('Failed to fetch tracking data');
        }
        const data = await response.json();
        console.log('Tracking data fetched:', data);
        
        setProgress(data);

        // New normalized datasets
        if (data.normalized) {
          setImprovement({
            current: data.normalized.overallCurrent || 0,
            previous: data.normalized.overallPrevious || 0,
            delta: data.normalized.improvementDelta || 0,
          });
          setNormalizedTrend(Array.isArray(data.normalized.trend) ? data.normalized.trend : []);
          const dims = data.normalized.dimensions || {};
          setDimensionRadarData([
            { subject: 'Fundamental', value: Math.round(dims.FUND || 0) },
            { subject: 'Problem Solving', value: Math.round(dims.PROB || 0) },
            { subject: 'Communication', value: Math.round(dims.COMM || 0) },
            { subject: 'Domain', value: Math.round(dims.DOMAIN || 0) },
          ]);
          setModeBreakdown(data.normalized.modeBreakdown || {});
        }

        // Tính toán dữ liệu cho spider charts
        if (data.allActivities && Array.isArray(data.allActivities)) {
          const allActivities = data.allActivities as Activity[];

          // Tính toán metrics tổng quan
          const calculateOverallMetrics = (allActivities: Activity[]) => {
            if (allActivities.length === 0) {
              return [
                { subject: 'Tổng hoạt động', A: 0, B: 0, C: 0, D: 0, E: 0, fullMark: 100 },
                { subject: 'Điểm trung bình', A: 0, B: 0, C: 0, D: 0, E: 0, fullMark: 100 },
                { subject: 'Thời gian học', A: 0, B: 0, C: 0, D: 0, E: 0, fullMark: 300 },
                { subject: 'Tỷ lệ hoàn thành', A: 0, B: 0, C: 0, D: 0, E: 0, fullMark: 100 },
                { subject: 'Tần suất học', A: 0, B: 0, C: 0, D: 0, E: 0, fullMark: 20 }
              ];
            }

            const totalCount = allActivities.length;
            const avgScore = allActivities.reduce((sum, a) => sum + (a.score || 0), 0) / allActivities.length;
            const totalStudyTime = allActivities.reduce((sum, a) => sum + (a.duration || 0), 0);
            const completionRate = allActivities.filter(a => a.score !== undefined).length / allActivities.length * 100;
            
            // Tính tần suất (số lần/tháng) - sử dụng recentActivities
            const now = new Date();
            const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const monthlyActivities = allActivities.filter(a => new Date(a.timestamp || '') > oneMonthAgo);
            const frequency = monthlyActivities.length;

            return [
              { 
                subject: 'Total Activities', 
                A: Math.min(totalCount, 100), 
                B: 0, C: 0, D: 0, E: 0, 
                fullMark: 100,
                target: personalTargets.totalActivities,
                unit: 'times'
              },
              { 
                subject: 'Average Score', 
                A: Math.round(avgScore), 
                B: 0, C: 0, D: 0, E: 0, 
                fullMark: 100,
                target: personalTargets.averageScore,
                unit: '%'
              },
              { 
                subject: 'Study Time', 
                A: Math.min(totalStudyTime, 300), 
                B: 0, C: 0, D: 0, E: 0, 
                fullMark: 300,
                target: personalTargets.studyTime,
                unit: 'min'
              },
              { 
                subject: 'Completion Rate', 
                A: Math.round(completionRate), 
                B: 0, C: 0, D: 0, E: 0, 
                fullMark: 100,
                target: personalTargets.completionRate,
                unit: '%'
              },
              { 
                subject: 'Learning Frequency', 
                A: Math.min(frequency, 20), 
                B: 0, C: 0, D: 0, E: 0, 
                fullMark: 20,
                target: personalTargets.learningFrequency,
                unit: 'times/month'
              }
            ];
          };

          setOverallSpiderData(calculateOverallMetrics(allActivities));
        }
        // Group activities by period for the new chart
        if (data.allActivities && Array.isArray(data.allActivities)) {
          const activities = data.allActivities as Activity[];
          // Group activities by period
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
          // Convert to array for chart
          const chartData = Object.entries(grouped).map(([period, vals]) => {
            if (lineMode === 'score') {
              return {
                period,
                quiz: vals.quiz.length ? (vals.quiz.reduce((a, b) => a + b, 0) / vals.quiz.length) : 0,
                test: vals.test.length ? (vals.test.reduce((a, b) => a + b, 0) / vals.test.length) : 0,
                interview: vals.interview.length ? (vals.interview.reduce((a, b) => a + b, 0) / vals.interview.length) : 0,
              };
            } else {
              return {
                period,
                quiz: vals.quiz.length,
                test: vals.test.length,
                interview: vals.interview.length,
              };
            }
          }).sort((a, b) => a.period.localeCompare(b.period));
          setLineChartData(chartData);
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
        // Cung cấp dữ liệu mặc định nếu có lỗi
        setProgress({
          stats: {
            totalInterviews: 0,
            averageScore: 0.0,
            studyStreak: 0,
            totalStudyTime: 0
          },
          skillProgress: [],
          currentFocus: ['Complete your first interview practice'],
          nextMilestones: [
            {
              goal: 'Complete first interview practice',
              targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
          ],
          recommendations: [
            'Start with a practice interview to assess your current level',
            'Set up your learning goals in the dashboard',
            'Review available learning resources'
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded && user) {
      fetchProgress();
    }
  }, [isLoaded, user, viewMode, lineMode, targetUpdateTrigger, personalTargets]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No progress data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overall RadarChart (spider chart) */}
      {/* Overall Improvement and Trend */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Overall Improvement</h2>
          <div className={`text-lg font-semibold ${improvement.delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {improvement.delta >= 0 ? '+' : ''}{improvement.delta.toFixed(2)}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1">
            <div className="text-sm text-gray-500">Current (0-100)</div>
            <div className="text-3xl font-semibold">{improvement.current.toFixed(1)}%</div>
            <div className="mt-2 text-sm text-gray-500">Previous</div>
            <div className="text-xl">{improvement.previous.toFixed(1)}%</div>
            {/* Mode breakdown */}
            <div className="mt-6">
              <div className="text-sm font-medium mb-2">Mode breakdown</div>
              <div className="space-y-2">
                {Object.keys(modeBreakdown).length === 0 && (
                  <div className="text-sm text-gray-500">No data</div>
                )}
                {Object.entries(modeBreakdown).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{k}</span>
                    <span className="text-sm font-medium">{v.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-span-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={normalizedTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value: number) => value.toFixed(1) + '%'} />
                <Legend />
                <Line type="monotone" dataKey="overall" name="Overall" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Dimension Radar (normalized) */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Dimensions (Normalized)</h2>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={dimensionRadarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Radar name="Current" dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Legacy Overall RadarChart (kept) */}
      <Card className="p-6">
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
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={overallSpiderData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const currentValue = payload[0].value as number;
                    const targetValue = data.target || 0;
                    const unit = data.unit || '';
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-semibold text-gray-800 mb-1">{label}</p>
                        <div className="space-y-1">
                          <p className="text-blue-600 font-medium">
                            Current: {currentValue}{unit}
                          </p>
                          {targetValue > 0 && (
                            <p className="text-sm text-gray-600">
                              Target: {targetValue}{unit}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Radar
                name="Current"
                dataKey="A"
                stroke="#2563eb"
                fill="#2563eb"
                fillOpacity={0.3}
              />
              <Radar
                name="Target"
                dataKey="target"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.1}
                strokeDasharray="5 5"
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      {/* Multi-Line Chart */}
      <Card className="p-6">
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
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
                <YAxis domain={[0, lineMode === 'score' ? 10 : 'auto']} />
              <Tooltip formatter={(value: number) => lineMode === 'score' ? value.toFixed(1) + '%' : value} />
              <Legend />
              <Line type="monotone" dataKey="quiz" name="Quiz" stroke="#7c3aed" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="test" name="Test" stroke="#dc2626" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="interview" name="Interview" stroke="#059669" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Activities</h3>
          <p className="mt-2 text-3xl font-semibold">
            {progress?.allActivities?.length || 0}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Average Score</h3>
          <p className="mt-2 text-3xl font-semibold">
            {progress.stats.averageScore.toFixed(1)}%
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Study Streak</h3>
          <p className="mt-2 text-3xl font-semibold">
            {progress.stats.studyStreak} days
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Study Time</h3>
          <p className="mt-2 text-3xl font-semibold">
            {(() => {
              const total = progress.stats.totalStudyTime;
              if (total < 60) return `${total} min`;
              const hours = Math.floor(total / 60);
              const minutes = total % 60;
              return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
            })()}
          </p>
        </Card>
      </div>

      {/* Skills Progress */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Skills Progress</h2>
        <div className="space-y-6">
          {progress.skillProgress.map((skill) => (
            <div key={skill.name}>
              <div className="flex justify-between mb-2">
                <span className="font-medium">{skill.name}</span>
                <span className="text-sm text-gray-500">{skill.level}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${skill.score}%` }}
                />
              </div>
              {skill.progress.length > 0 && (
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
      </Card>

      {/* Current Focus & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Current Focus</h2>
          <ul className="space-y-2">
            {(progress.currentFocus ?? []).map((focus: string, index: number) => (
              <li
                key={index}
                className="flex items-center text-gray-700"
              >
                <span className="w-2 h-2 bg-primary rounded-full mr-2" />
                {focus}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
          <ul className="space-y-2">
            {(progress.recommendations ?? []).map((recommendation: string, index: number) => (
              <li
                key={index}
                className="flex items-center text-gray-700"
              >
                <span className="w-2 h-2 bg-primary rounded-full mr-2" />
                {recommendation}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Upcoming Milestones */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Upcoming Milestones</h2>
        <div className="space-y-4">
          {(progress.nextMilestones ?? []).map((milestone: { goal: string; targetDate: Date }, index: number) => (
            <div
              key={index}
              className="flex justify-between items-center border-b border-gray-100 pb-4 last:border-0 last:pb-0"
            >
              <span className="font-medium">{milestone.goal}</span>
              <span className="text-sm text-gray-500">
                {new Date(milestone.targetDate).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Target Setting Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Set Overall Progress Targets</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowTargetModal(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalActivities">Total Activities</Label>
                <Input
                  id="totalActivities"
                  type="number"
                  value={personalTargets.totalActivities}
                  onChange={(e) => setPersonalTargets(prev => ({...prev, totalActivities: parseInt(e.target.value) || 0}))}
                />
              </div>
              <div>
                <Label htmlFor="averageScore">Average Score (%)</Label>
                <Input
                  id="averageScore"
                  type="number"
                  min="0"
                  max="100"
                  value={personalTargets.averageScore}
                  onChange={(e) => setPersonalTargets(prev => ({...prev, averageScore: parseInt(e.target.value) || 0}))}
                />
              </div>
              <div>
                <Label htmlFor="studyTime">Study Time (minutes)</Label>
                <Input
                  id="studyTime"
                  type="number"
                  value={personalTargets.studyTime}
                  onChange={(e) => setPersonalTargets(prev => ({...prev, studyTime: parseInt(e.target.value) || 0}))}
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
                  onChange={(e) => setPersonalTargets(prev => ({...prev, completionRate: parseInt(e.target.value) || 0}))}
                />
              </div>
              <div>
                <Label htmlFor="learningFrequency">Learning Frequency (times/month)</Label>
                <Input
                  id="learningFrequency"
                  type="number"
                  value={personalTargets.learningFrequency}
                  onChange={(e) => setPersonalTargets(prev => ({...prev, learningFrequency: parseInt(e.target.value) || 0}))}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline"
                onClick={() => setShowTargetModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  // Save targets to localStorage or API
                  localStorage.setItem('personalTargets', JSON.stringify(personalTargets));
                  setShowTargetModal(false);
                  // Trigger recalculation of spider chart data
                  setTargetUpdateTrigger(prev => prev + 1);
                }}
              >
                Save Targets
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
