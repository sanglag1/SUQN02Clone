import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, MessageSquare, Calendar, Clock } from 'lucide-react';

interface HistoryItem {
  question: string;
  answer: string;
  evaluation: {
    scores: {
      fundamental: number;
      logic: number;
      language: number;
    };
    suggestions: {
      fundamental: string;
      logic: string;
      language: string;
    };
  };
  topic: string;
  timestamp: string;
  questionNumber?: number;
}

interface Assessment {
  id: string;
  type: string;
  level: string;
  duration: number;
  totalTime: number;
  history: HistoryItem[];
  createdAt: string;
  jobRole?: {
    title: string; 
  };
}

interface QuestionHistoryViewerProps {
  className?: string;
}

export const QuestionHistoryViewer: React.FC<QuestionHistoryViewerProps> = ({ className = "" }) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [expandedAssessment, setExpandedAssessment] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/assessment?type=test');
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [QuestionHistoryViewer] Raw assessments data:', data);

        // Parse history string to array for each assessment
        const parsedData = data.map((assessment: Assessment) => ({
          ...assessment,
          history:
            typeof assessment.history === 'string'
              ? JSON.parse(assessment.history)
              : Array.isArray(assessment.history)
                ? assessment.history
                : [],
        }));

        // Filter only assessments that have history data
        const assessmentsWithHistory = parsedData.filter((assessment: Assessment) =>
          assessment.history && Array.isArray(assessment.history) && assessment.history.length > 0
        );

        console.log('🔍 [QuestionHistoryViewer] Assessments with history:', assessmentsWithHistory);

        // Sort by most recent first, but prioritize assessments with history
        const sortedAssessments = assessmentsWithHistory.sort((a: Assessment, b: Assessment) => {
          const aHasHistory = a.history && a.history.length > 0;
          const bHasHistory = b.history && b.history.length > 0;

          if (aHasHistory && !bHasHistory) return -1;
          if (!aHasHistory && bHasHistory) return 1;

          // If both have history or both don't have history, sort by date
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        console.log('🔍 [QuestionHistoryViewer] Final sorted assessments:', sortedAssessments);
        setAssessments(sortedAssessments);
      }
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`${className} p-6`}>
        <div className="text-center">Loading interview history...</div>
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <div className={`${className} p-6`}>
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No interview history found with question details.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Interview History</h2>
          <Badge variant="outline" className="ml-auto">
            {assessments.length} sessions
          </Badge>
        </div>

        {assessments.map((assessment) => (
          <Card key={assessment.id} className="border border-gray-200">
            <CardHeader className="pb-3">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedAssessment(
                  expandedAssessment === assessment.id ? null : assessment.id
                )}
              >
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {assessment.jobRole?.title || 'Interview Session'}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(assessment.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {assessment.totalTime} min
                    </span>
                    <Badge variant="outline">{assessment.level}</Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {assessment.history.length} questions
                    </Badge>
                  </CardDescription>
                </div>
                {expandedAssessment === assessment.id ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </CardHeader>

            {expandedAssessment === assessment.id && (
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {assessment.history.map((item, index) => {
                    const questionKey = `${assessment.id}-${index}`;
                    return (
                      <Card key={index} className="border border-gray-100">
                        <CardHeader className="pb-2">
                          <div 
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setExpandedQuestion(
                              expandedQuestion === questionKey ? null : questionKey
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                Q{item.questionNumber || index + 1}
                              </Badge>
                              <span className="font-medium text-gray-900 text-sm">
                                {item.topic}
                              </span>
                            </div>
                            {expandedQuestion === questionKey ? (
                              <ChevronUp className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                        </CardHeader>
                        
                        {expandedQuestion === questionKey && (
                          <CardContent className="pt-0">
                            <div className="space-y-4">
                              {/* Question */}
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2 text-sm">Question:</h4>
                                <p className="text-gray-700 bg-blue-50 p-3 rounded-lg text-sm">
                                  {item.question}
                                </p>
                              </div>
                              
                              {/* Answer */}
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2 text-sm">Your Answer:</h4>
                                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">
                                  {item.answer}
                                </p>
                              </div>
                              
                              {/* Scores */}
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3 text-sm">Evaluation Scores:</h4>
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="text-center">
                                    <div className="text-xl font-bold text-blue-600">
                                      {Math.round(item.evaluation.scores.fundamental * 10)}%
                                    </div>
                                    <div className="text-xs text-gray-600">Fundamental</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xl font-bold text-purple-600">
                                      {Math.round(item.evaluation.scores.logic * 10)}%
                                    </div>
                                    <div className="text-xs text-gray-600">Logic</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xl font-bold text-green-600">
                                      {Math.round(item.evaluation.scores.language * 10)}%
                                    </div>
                                    <div className="text-xs text-gray-600">Language</div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Suggestions */}
                              {(item.evaluation.suggestions.fundamental || 
                                item.evaluation.suggestions.logic || 
                                item.evaluation.suggestions.language) && (
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">Feedback:</h4>
                                  <div className="space-y-2">
                                    {item.evaluation.suggestions.fundamental && (
                                      <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded">
                                        <strong>Fundamental:</strong> {item.evaluation.suggestions.fundamental}
                                      </p>
                                    )}
                                    {item.evaluation.suggestions.logic && (
                                      <p className="text-xs text-purple-700 bg-purple-50 p-2 rounded">
                                        <strong>Logic:</strong> {item.evaluation.suggestions.logic}
                                      </p>
                                    )}
                                    {item.evaluation.suggestions.language && (
                                      <p className="text-xs text-green-700 bg-green-50 p-2 rounded">
                                        <strong>Language:</strong> {item.evaluation.suggestions.language}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
