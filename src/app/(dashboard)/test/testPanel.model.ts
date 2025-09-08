// Model cho TestPanel (TypeScript)

export type InterviewPhase = 'introduction' | 'interviewing' | 'completed';

export interface ConversationMessage {
  id: string | number;
  sender: 'user' | 'ai';
  text: string;
  isError?: boolean;
  timestamp?: string;
}

export interface InterviewState {
  phase: InterviewPhase;
  topics: string[];
  currentTopicIndex: number;
  questions: string[];
  currentQuestionIndex: number;
}

export interface RealTimeScores {
  fundamental: number;
  logic: number;
  language: number;
  suggestions: {
    fundamental: string;
    logic: string;
    language: string;
  };
}

export interface EvaluationScores {
  fundamentalKnowledge: number;
  logicalReasoning: number;
  languageFluency: number;
  overall: number;
}

export interface HistoryStage {
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
  questionNumber?: number; // Thêm số thứ tự câu hỏi
}

export interface InterviewConfig {
  maxQuestions: number; // Giới hạn số câu hỏi chính thức
  reviewTimeSeconds: number; // Thời gian review sau câu cuối
} 