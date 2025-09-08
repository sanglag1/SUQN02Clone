"use client";

import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';

export interface DetailedScores {
  content: number;
  relevance: number;
  clarity: number;
  overall: number;
}

interface ScoreChartProps {
  scores: DetailedScores;
  level: 'basic' | 'intermediate' | 'advanced';
  readinessScore: number;
  className?: string;
}

const ScoreChart: React.FC<ScoreChartProps> = ({ 
  scores, 
  level, 
  readinessScore, 
  className = "" 
}) => {
  // Prepare data for radar chart
  const radarData = [
    { subject: 'Content', score: scores.content, fullMark: 10 },
    { subject: 'Relevance', score: scores.relevance, fullMark: 10 },
    { subject: 'Clarity', score: scores.clarity, fullMark: 10 },
  ];

  // Prepare data for bar chart
  const barData = [
    { name: 'Content', score: scores.content },
    { name: 'Relevance', score: scores.relevance },
    { name: 'Clarity', score: scores.clarity },
  ];

  // Color scheme based on score
  const getScoreColor = (score: number) => {
    if (score >= 8) return '#22C55E'; // Green
    if (score >= 6) return '#F59E0B'; // Yellow
    if (score >= 4) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  // Level colors
  const levelColors = {
    basic: '#3B82F6',
    intermediate: '#8B5CF6', 
    advanced: '#EF4444'
  };


  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Performance Analysis</h3>
          <p className="text-sm text-gray-500">Detailed breakdown of your answer quality</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium text-white`} 
             style={{ backgroundColor: levelColors[level] }}>
          {level.charAt(0).toUpperCase() + level.slice(1)} Level
        </div>
      </div>

      {/* Overall Score Card */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Overall Score</p>
            <p className="text-3xl font-bold text-gray-900">{scores.overall.toFixed(1)}/10</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600">Next Level Readiness</p>
            <p className="text-2xl font-bold" style={{ color: getScoreColor(readinessScore / 10) }}>
              {readinessScore}%
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">Skills Radar</h4>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid gridType="polygon" />
              <PolarAngleAxis 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                className="text-xs"
              />
              <PolarRadiusAxis 
                domain={[0, 10]} 
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                angle={90}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">Score Breakdown</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fill: '#6B7280' }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                domain={[0, 10]}
                tick={{ fontSize: 10, fill: '#6B7280' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#F9FAFB', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="score" radius={[2, 2, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Readiness Progress */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">Next Level Readiness</h4>
          <span className="text-xs text-gray-500">{readinessScore}% Ready</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="h-3 rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: `${readinessScore}%`,
              backgroundColor: getScoreColor(readinessScore / 10)
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Not Ready</span>
          <span>Fully Ready</span>
        </div>
      </div>

      {/* Score Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-600">Excellent (8-10)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span className="text-gray-600">Good (6-7)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded"></div>
          <span className="text-gray-600">Fair (4-5)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-gray-600">Needs Work (1-3)</span>
        </div>
      </div>
    </div>
  );
};

export default ScoreChart;
