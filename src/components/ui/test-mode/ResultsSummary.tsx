import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Brain, Award, RotateCcw, MessageSquare } from 'lucide-react';
import { QuestionHistoryViewer } from './QuestionHistoryViewer';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

interface ResultsSummaryProps {
  results: {
    duration: number;
    position: string;
    level: string;
    scores: {
      fundamentalKnowledge: number;
      logicalReasoning: number;
      languageFluency: number;
      overall: number;
    };
    messages: unknown[];
    timestamp: string;
    totalTime?: number; // Thêm trường totalTime ở đây
  };
  realTimeScores?: {
    fundamental: number;
    logic: number;
    language: number;
    suggestions: {
      fundamental: string;
      logic: string;
      language: string;
    };
  };
  onReset: () => void;
}

export function ResultsSummary({ results, realTimeScores, onReset }: Omit<ResultsSummaryProps, 'settings'>) {
  const [showQuestionHistory, setShowQuestionHistory] = useState(false);

  const categoryList = [
    { key: 'fundamental', label: 'Fundamental Knowledge', icon: <BookOpen className="h-8 w-8 mb-2 text-blue-500" /> },
    { key: 'logic', label: 'Logical Reasoning', icon: <Brain className="h-8 w-8 mb-2 text-purple-500" /> },
    { key: 'language', label: 'Language Proficiency', icon: <Award className="h-8 w-8 mb-2 text-green-500" /> }
  ];

  // Luôn lấy điểm từ finalScores (results.scores) cho chart
  const chartScores: Record<string, number> = {
  fundamental: (results.scores.fundamentalKnowledge ?? 0) * 10,
  logic: (results.scores.logicalReasoning ?? 0) * 10,
  language: (results.scores.languageFluency ?? 0) * 10,
};

  // Sử dụng chartScores cho mọi phần hiển thị điểm
  const scores: Record<string, number> = chartScores;

  const suggestions: Record<string, string> = realTimeScores
    ? realTimeScores.suggestions
    : { fundamental: '', logic: '', language: '' };

  // Tính overall từ finalScores (chartScores)
  const overall = Math.round((chartScores.fundamental + chartScores.logic + chartScores.language) / 3);

  const radarChartData = [
    { subject: 'Fundamental Knowledge', A: chartScores.fundamental, fullMark: 100 },
    { subject: 'Logical Reasoning', A: chartScores.logic, fullMark: 100 },
    { subject: 'Language Proficiency', A: chartScores.language, fullMark: 100 },
  ];

  const barChartData = [
    { name: 'Fundamental Knowledge', score: chartScores.fundamental },
    { name: 'Logical Reasoning', score: chartScores.logic },
    { name: 'Language Proficiency', score: chartScores.language },
  ];

  // Hàm tạo nhận xét tổng quan
  function getOverallSummary(scores: Record<string, number>) {
    const f = scores.fundamental;
    const l = scores.logic;
    const lang = scores.language;
    if (f >= 80 && l >= 80 && lang >= 80) return 'Excellent performance in all areas. You are well-prepared for interviews!';
    if (f < 50 && l < 50 && lang < 50) return 'You need to improve in all areas. Focus on fundamental knowledge, logical reasoning, and language proficiency.';
    if (f < 60 && l >= 70 && lang >= 70) return 'Your logic and language are strong, but you should review fundamental knowledge.';
    if (l < 60 && f >= 70 && lang >= 70) return 'Your fundamental knowledge and language are good, but logical reasoning needs improvement.';
    if (lang < 60 && f >= 70 && l >= 70) return 'Your fundamental knowledge and logic are good, but language proficiency needs improvement.';
    if (f < 60) return 'You should focus on improving your fundamental knowledge.';
    if (l < 60) return 'You should focus on improving your logical reasoning.';
    if (lang < 60) return 'You should focus on improving your language proficiency.';
    return 'Good effort! Keep practicing to improve further.';
  }

  return (
    <Card className="w-full max-w-5xl mx-auto mt-10 border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white rounded-t-2xl">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <CardTitle className="text-2xl text-white">Interview Summary</CardTitle>
            <CardDescription className="text-white/80">
              {new Date(results.timestamp).toLocaleString()} • {results.position} ({results.level})
              {typeof results.totalTime === 'number' && results.totalTime > 0 && (
                <span className="ml-2 font-semibold">• Total time: {results.totalTime} min</span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-80">Overall</span>
            <Badge variant="outline" className="text-lg px-3 py-1 bg-white/10 text-white border-white/30">
              {overall}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {categoryList.map(cat => (
            <Card key={cat.key} className="border border-gray-200 shadow-sm">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                {cat.icon}
                <h3 className="font-medium">{cat.label}</h3>
                <div className="text-3xl font-bold mt-2">
                  {Math.round(scores[cat.key])}%
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="mb-6 border border-gray-200">
          <CardHeader>
            <CardTitle>Feedback & Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 font-semibold text-blue-700">{getOverallSummary(scores)}</div>
            <ul className="space-y-2">
              {categoryList.map(cat => (
                <li key={cat.key} className="flex flex-col gap-1">
                  <span className="font-semibold">{cat.label}:</span>
                  <span>{suggestions[cat.key] || 'No suggestion.'}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius={90} data={radarChartData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Performance" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle>Detailed Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Questions Review Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Interview Questions Review
            </CardTitle>
            <CardDescription>
              View your recent interview questions and answers from database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                Click below to view your interview history with detailed questions and feedback.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setShowQuestionHistory(!showQuestionHistory)}
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                {showQuestionHistory ? 'Hide' : 'View'} Question History
              </Button>
            </div>
            
            {showQuestionHistory && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <QuestionHistoryViewer />
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={onReset} className="flex items-center gap-2 border-indigo-200 text-indigo-700">
            <RotateCcw className="w-4 h-4" />
            Practice again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}