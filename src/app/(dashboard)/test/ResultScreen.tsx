import React from "react";
import { ResultsSummary } from '@/components/ui/test-mode/ResultsSummary';

interface ResultScreenProps {
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
    totalTime?: number;
  };
  realTimeScores: {
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

const ResultScreen: React.FC<ResultScreenProps> = ({ results, realTimeScores, onReset }) => {
  return (
    <ResultsSummary results={results} realTimeScores={realTimeScores} onReset={onReset} />
  );
};

export default ResultScreen;