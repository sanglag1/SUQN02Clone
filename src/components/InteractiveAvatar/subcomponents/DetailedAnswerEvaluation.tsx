import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
interface AnswerEvaluation {
  questionIndex: number;
  questionText: string;
  userAnswer: string;
  evaluation: {
    score: number;
    technicalAccuracy: number;
    completeness: number;
    clarity: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    keywords: string[];
    skillTags: string[];
  };
}

interface DetailedAnswerEvaluationProps {
  answerEvaluation: AnswerEvaluation;
  language?: 'vi-VN' | 'en-US';
}

export default function DetailedAnswerEvaluation({ 
  answerEvaluation, 
  language = 'vi-VN' 
}: DetailedAnswerEvaluationProps) {
  const { questionText, userAnswer, evaluation } = answerEvaluation;
  
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return language === 'vi-VN' ? 'Tốt' : 'Good';
    if (score >= 6) return language === 'vi-VN' ? 'Khá' : 'Fair';
    return language === 'vi-VN' ? 'Cần cải thiện' : 'Needs Improvement';
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">
          {language === 'vi-VN' ? 'Câu hỏi' : 'Question'} #{answerEvaluation.questionIndex + 1}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Câu hỏi */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">
            {language === 'vi-VN' ? 'Câu hỏi:' : 'Question:'}
          </h4>
          <p className="text-gray-800 bg-gray-50 p-3 rounded-md">
            {questionText}
          </p>
        </div>

        {/* Câu trả lời */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">
            {language === 'vi-VN' ? 'Câu trả lời:' : 'Answer:'}
          </h4>
          <p className="text-gray-800 bg-blue-50 p-3 rounded-md">
            {userAnswer}
          </p>
        </div>

        <Separator />

        {/* Điểm số */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(evaluation.score)}`}>
              {evaluation.score}/10
            </div>
            <div className="text-sm text-gray-600">
              {language === 'vi-VN' ? 'Điểm tổng' : 'Overall'}
            </div>
            <div className="text-xs text-gray-500">
              {getScoreLabel(evaluation.score)}
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-xl font-semibold ${getScoreColor(evaluation.technicalAccuracy)}`}>
              {evaluation.technicalAccuracy}/10
            </div>
            <div className="text-sm text-gray-600">
              {language === 'vi-VN' ? 'Độ chính xác' : 'Accuracy'}
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-xl font-semibold ${getScoreColor(evaluation.completeness)}`}>
              {evaluation.completeness}/10
            </div>
            <div className="text-sm text-gray-600">
              {language === 'vi-VN' ? 'Độ đầy đủ' : 'Completeness'}
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-xl font-semibold ${getScoreColor(evaluation.clarity)}`}>
              {evaluation.clarity}/10
            </div>
            <div className="text-sm text-gray-600">
              {language === 'vi-VN' ? 'Độ rõ ràng' : 'Clarity'}
            </div>
          </div>
        </div>

        {/* Điểm mạnh */}
        {evaluation.strengths.length > 0 && (
          <div>
            <h4 className="font-semibold text-green-700 mb-2">
              {language === 'vi-VN' ? 'Điểm mạnh:' : 'Strengths:'}
            </h4>
            <ul className="list-disc list-inside space-y-1">
              {evaluation.strengths.map((strength, index) => (
                <li key={index} className="text-green-700">
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Điểm yếu */}
        {evaluation.weaknesses.length > 0 && (
          <div>
            <h4 className="font-semibold text-red-700 mb-2">
              {language === 'vi-VN' ? 'Điểm yếu:' : 'Weaknesses:'}
            </h4>
            <ul className="list-disc list-inside space-y-1">
              {evaluation.weaknesses.map((weakness, index) => (
                <li key={index} className="text-red-700">
                  {weakness}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Gợi ý cải thiện */}
        {evaluation.suggestions.length > 0 && (
          <div>
            <h4 className="font-semibold text-blue-700 mb-2">
              {language === 'vi-VN' ? 'Gợi ý cải thiện:' : 'Suggestions:'}
            </h4>
            <ul className="list-disc list-inside space-y-1">
              {evaluation.suggestions.map((suggestion, index) => (
                <li key={index} className="text-blue-700">
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Từ khóa và kỹ năng */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Từ khóa */}
          {evaluation.keywords.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">
                {language === 'vi-VN' ? 'Từ khóa:' : 'Keywords:'}
              </h4>
              <div className="flex flex-wrap gap-2">
                {evaluation.keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Kỹ năng */}
          {evaluation.skillTags.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">
                {language === 'vi-VN' ? 'Kỹ năng thể hiện:' : 'Skills Demonstrated:'}
              </h4>
              <div className="flex flex-wrap gap-2">
                {evaluation.skillTags.map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


