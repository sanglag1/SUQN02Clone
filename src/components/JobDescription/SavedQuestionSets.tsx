// components/JobDescription/SavedQuestionSets.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Clock, FileText, Users, Trash2, RefreshCw } from 'lucide-react';
import { questionSetService, QuestionSetData } from '@/services/questionSetService';

interface SavedQuestionSetsProps {
  onQuestionSetSelect: (questionSet: QuestionSetData) => void;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const SavedQuestionSets: React.FC<SavedQuestionSetsProps> = ({ onQuestionSetSelect, onShowToast }) => {
  const [questionSets, setQuestionSets] = useState<QuestionSetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadQuestionSets();
  }, []);

  const loadQuestionSets = async () => {
    try {
      setLoading(true);
      setError('');
      const sets = await questionSetService.getAllQuestionSets();
      setQuestionSets(sets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load question sets');
    } finally {
      setLoading(false);
    }
  };  const handleDelete = async (id: string, title: string, event: React.MouseEvent) => {
    event.stopPropagation();

    try {
      await questionSetService.deleteQuestionSet(id);
      // Filter by id (Prisma UUID)
      setQuestionSets(prev => prev.filter(set => set.id !== id));
      
      // Show success toast
      if (onShowToast) {
        onShowToast(`Question set "${title}" has been deleted!`, 'success');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete question set';
      setError(errorMessage);
      
      // Show error toast
      if (onShowToast) {
        onShowToast(`Failed to delete "${title}": ${errorMessage}`, 'error');
      }
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'junior': return 'bg-green-100 text-green-800';
      case 'mid': return 'bg-blue-100 text-blue-800';
      case 'senior': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'technical' 
      ? 'bg-orange-100 text-orange-800'
      : 'bg-pink-100 text-pink-800';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-purple-600 mr-2" />
          <span className="text-gray-600">Loading saved question sets...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadQuestionSets}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Saved Question Sets</h3>
          <button
            onClick={loadQuestionSets}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {questionSets.length} saved question {questionSets.length === 1 ? 'set' : 'sets'}
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {questionSets.length === 0 ? (
          <div className="p-6 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No saved question sets yet.</p>
            <p className="text-sm text-gray-400 mt-1">
              Generate questions from a job description to see them here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {questionSets.map((questionSet, index) => (
              <div
                key={questionSet.id || `questionset-${index}`}
                onClick={() => onQuestionSetSelect(questionSet)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {questionSet.jobTitle}
                    </h4>
                    
                    <div className="flex items-center mt-2 space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(questionSet.level)}`}>
                        <Users className="w-3 h-3 mr-1" />
                        {questionSet.level}
                      </span>
                      
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(questionSet.questionType)}`}>
                        {questionSet.questionType}
                      </span>
                      
                      <span className="text-xs text-gray-500">
                        {questionSet.questions.length} questions
                      </span>
                    </div>

                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {questionSet.createdAt && formatDate(questionSet.createdAt)}
                      {questionSet.fileName && (
                        <>
                          <span className="mx-2">•</span>
                          <FileText className="w-3 h-3 mr-1" />
                          {questionSet.fileName}
                        </>
                      )}
                    </div>
                  </div>                  <button
                    onClick={(e) => handleDelete(questionSet.id || `questionset-${index}`, questionSet.jobTitle, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 rounded transition-all"
                    title="Delete question set"
                    disabled={!questionSet.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedQuestionSets;
