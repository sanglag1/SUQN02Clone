import React, { useState, useEffect } from 'react';

interface QuestionBankStats {
  totalQuestions: number;
  fields: string[];
  topics: string[];
  levels: string[];
  fieldStats: Array<{ field: string; count: number }>;
  topicStats: Array<{ topic: string; count: number }>;
  levelStats: Array<{ level: string; count: number }>;
}

export default function QuestionBankStats() {
  const [stats, setStats] = useState<QuestionBankStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/questions/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch question bank stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600 text-center">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z" />
          </svg>
          <p>Error loading question bank stats: {error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Question Bank Statistics
        </h2>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{stats.totalQuestions}</div>
          <div className="text-sm text-gray-500">Total Questions</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Fields Stats */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Fields</h3>
          <div className="space-y-2">
            {stats.fieldStats
              .sort((a, b) => b.count - a.count)
              .slice(0, 5)
              .map((field) => (
                <div key={field.field} className="flex justify-between items-center">
                  <span className="text-sm text-blue-800 truncate">{field.field}</span>
                  <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {field.count}
                  </span>
                </div>
              ))}
          </div>
          {stats.fieldStats.length > 5 && (
            <div className="text-xs text-blue-600 mt-2">
              +{stats.fieldStats.length - 5} more fields
            </div>
          )}
        </div>

        {/* Topics Stats */}
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-green-900 mb-3">Topics</h3>
          <div className="space-y-2">
            {stats.topicStats
              .sort((a, b) => b.count - a.count)
              .slice(0, 5)
              .map((topic) => (
                <div key={topic.topic} className="flex justify-between items-center">
                  <span className="text-sm text-green-800 truncate">{topic.topic}</span>
                  <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                    {topic.count}
                  </span>
                </div>
              ))}
          </div>
          {stats.topicStats.length > 5 && (
            <div className="text-xs text-green-600 mt-2">
              +{stats.topicStats.length - 5} more topics
            </div>
          )}
        </div>

        {/* Levels Stats */}
        <div className="bg-purple-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-purple-900 mb-3">Levels</h3>
          <div className="space-y-2">
            {stats.levelStats
              .sort((a, b) => b.count - a.count)
              .map((level) => (
                <div key={level.level} className="flex justify-between items-center">
                  <span className="text-sm text-purple-800 capitalize">{level.level}</span>
                  <span className="text-sm font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded">
                    {level.count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Integration Status */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900">AI Interview Integration</h4>
            <p className="text-sm text-blue-700 mt-1">
              Questions are automatically integrated with AI interview system
            </p>
          </div>
          <div className="flex items-center text-green-600">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
