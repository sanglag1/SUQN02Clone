import React from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export interface Interview {
  id: string;
  userId: string;
  jobRoleId: string;
  jobRole: {
    title: string;
    level: string;
    displayName: string;
  };
  language: string;
  startTime: Date | string;
  endTime?: Date | string;
  duration?: number;
  status: string;
  progress: number;
  questionCount: number;
  coveredTopics: string[];
  conversationHistory?: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
  evaluation?: {
    overallRating: number;
    technicalScore: number;
    communicationScore: number;
    problemSolvingScore: number;
    recommendations?: string[];
  };
  skillAssessment?: Record<string, number>;
}

interface InterviewResultProps {
  interview: Interview;
  onBack: () => void;
  onViewEvaluation?: () => void;
}

function getStatusColor(status: string) {
  switch (status) {
    case "completed":
    case "Hoàn thành":
      return "bg-green-100 text-green-700 border-green-300";
    case "pending":
    case "Đang chờ":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "cancelled":
    case "Đã hủy":
      return "bg-red-100 text-red-700 border-red-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

export default function InterviewResult({ interview, onBack, onViewEvaluation }: InterviewResultProps) {
  if (!interview) return null;
  return (
    <div className="w-full h-full min-h-[400px] max-w-2xl mx-auto bg-white rounded-xl shadow-lg flex flex-col p-6 mt-4 mb-4">
      <h2 className="text-2xl font-bold mb-2 text-blue-700 text-center"> Interview Result </h2>
      <div className="flex flex-wrap gap-4 justify-between mb-2">
        <div>
          <div className="mb-1 text-sm text-gray-500">Job Role</div>
          <div className="font-semibold text-base">{interview.jobRole?.displayName}</div>
        </div>
        <div>
          <div className="mb-1 text-sm text-gray-500">Time</div>
          <div className="text-base">{interview.startTime ? new Date(interview.startTime).toLocaleString() : ''}</div>
        </div>
        <div>
          <div className="mb-1 text-sm text-gray-500">Status</div>
          <span className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold ${getStatusColor(interview.status)}`}>{interview.status}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 justify-between mb-2">
        <div>
          <div className="mb-1 text-sm text-gray-500">Total Score</div>
          <span className="font-bold text-yellow-600 text-lg">{interview.evaluation?.overallRating ?? 'N/A'}</span>
        </div>
        <div>
          <div className="mb-1 text-sm text-gray-500">Question Count</div>  
          <span className="font-semibold">{interview.questionCount}</span>
        </div>
        <div>
          <div className="mb-1 text-sm text-gray-500">Language</div>
          <span className="font-semibold">{interview.language?.toUpperCase()}</span>
        </div>
      </div>
      <div className="mb-2">
        <div className="mb-1 text-sm text-gray-500">Comment</div>
        <div className="text-base text-gray-800">{interview.evaluation?.recommendations?.join(', ') ?? 'Không có'}</div>
      </div>
      {interview.skillAssessment && Object.keys(interview.skillAssessment).length > 0 && (
        <>
          <Separator className="my-4" />
          <h3 className="text-lg font-semibold mb-2">Skill Assessment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(interview.skillAssessment).map(([skill, score]) => (
              <div key={skill} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-md">
                <span className="font-medium">{skill}:</span>
                <Badge variant="outline" className="bg-primary/10 text-primary-foreground">{score}/10</Badge>
              </div>
            ))}
          </div>
        </>
      )}
      {Array.isArray(interview.conversationHistory) && interview.conversationHistory.length > 0 && (
        <>
          <Separator className="my-4" />
          <h3 className="text-lg font-semibold mb-2">Conversation History</h3>
          <div className="space-y-3 max-h-[250px] overflow-y-auto border rounded-md p-3 bg-gray-50">
            {interview.conversationHistory.map((msg: { role: string; content: string; timestamp: string }, idx: number) => {
              if (!msg) return null;
              const safeTimestamp = typeof msg.timestamp === 'string' ? msg.timestamp : '';
              return (
                <div key={idx} className={`text-sm p-2 rounded-md ${msg.role === 'user' ? 'bg-blue-50 text-blue-900' : msg.role === 'ai' ? 'bg-green-50 text-green-900' : 'bg-gray-100 text-gray-700'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{msg.role === 'user' ? 'You' : msg.role === 'ai' ? 'AI' : 'Other'}:</span>
                    <span className="text-xs text-gray-400">{safeTimestamp ? new Date(safeTimestamp).toLocaleString() : ''}</span>
                  </div>
                  <div>{msg.content}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
      <div className="flex gap-4 mt-6 justify-center">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold shadow"
        >
          Back
        </button>
        {onViewEvaluation && (
          <button
            onClick={onViewEvaluation}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow"
          >
            View Detailed Evaluation
          </button>
        )}
      </div>
    </div>
  );
} 