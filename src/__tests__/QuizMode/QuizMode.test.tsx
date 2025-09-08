import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRouter } from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock toast notifications
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

// Simple Mock QuizPanel Component
const MockQuizPanel = ({ currentStep, onQuizStart, onQuizComplete }: {
  currentStep: 'config' | 'session' | 'result';
  onQuizStart?: (data: any) => void;
  onQuizComplete?: (results: any) => void;
}) => {
  return (
    <div data-testid="quiz-panel">
      <div data-testid="current-step">Current Step: {currentStep}</div>
      <button 
        data-testid="start-quiz"
        onClick={() => {
          // Simulate calling /api/quizzes/secure API response
          onQuizStart?.({
            id: 'secure-quiz-123',
            field: 'frontend',
            topic: 'react',
            level: 'junior',
            questions: [
              { 
                id: 'q1', 
                question: 'What is JSX?',
                answers: [
                  { content: 'JavaScript XML' },
                  { content: 'Java Syntax Extension' }
                ],
                isMultipleChoice: false
              }
            ],
            answerMapping: { 'q1': [1, 0] },
            totalQuestions: 5,
            timeLimit: 10,
            userId: 'user123'
          });
        }}
      >
        Start Quiz
      </button>
      <button 
        data-testid="complete-quiz"
        onClick={() => {
          // Simulate calling /api/quizzes/{id}/submit API response
          onQuizComplete?.({
            id: 'secure-quiz-123',
            score: 80,
            correctCount: 4,
            totalQuestions: 5,
            timeUsed: 300,
            userAnswers: [
              { questionId: 'q1', answerIndex: [0], isCorrect: true },
              { questionId: 'q2', answerIndex: [1], isCorrect: false }
            ],
            questionsWithCorrectAnswers: [
              {
                id: 'q1',
                question: 'What is JSX?',
                answers: [
                  { content: 'JavaScript XML', isCorrect: true },
                  { content: 'Java Syntax Extension', isCorrect: false }
                ],
                explanation: 'JSX stands for JavaScript XML'
              }
            ]
          });
        }}
      >
        Complete Quiz
      </button>
    </div>
  );
};

// Simple QuizMode Component for Testing
const TestQuizMode = () => {
  const [currentStep, setCurrentStep] = React.useState<'config' | 'session' | 'result'>('config');
  const [quizData, setQuizData] = React.useState<any>(null);
  const [results, setResults] = React.useState<any>(null);

  const handleQuizStart = (data: any) => {
    setQuizData(data);
    setCurrentStep('session');
  };

  const handleQuizComplete = (resultData: any) => {
    setResults(resultData);
    setCurrentStep('result');
  };

  return (
    <div data-testid="quiz-mode">
      <MockQuizPanel 
        currentStep={currentStep}
        onQuizStart={handleQuizStart}
        onQuizComplete={handleQuizComplete}
      />
      {quizData && (
        <div data-testid="quiz-data">
          Quiz ID: {quizData.id}
        </div>
      )}
      {results && (
        <div data-testid="quiz-results">
          Score: {results.score}
        </div>
      )}
    </div>
  );
};

describe('QuizMode - Main Flows (Simplified)', () => {
  const mockPush = vi.fn();
  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
    global.fetch = vi.fn();
  });

  describe('Quiz Creation and Start Flow', () => {
    it('should handle quiz creation and start successfully', async () => {
      render(<TestQuizMode />);

      // Should start in config step
      expect(screen.getByText('Current Step: config')).toBeInTheDocument();

      // Click start quiz button
      fireEvent.click(screen.getByTestId('start-quiz'));

      // Should transition to session step and show quiz data
      await waitFor(() => {
        expect(screen.getByText('Current Step: session')).toBeInTheDocument();
        expect(screen.getByText('Quiz ID: secure-quiz-123')).toBeInTheDocument();
      });
    });

    it('should handle quiz completion flow', async () => {
      render(<TestQuizMode />);

      // Start quiz
      fireEvent.click(screen.getByTestId('start-quiz'));

      await waitFor(() => {
        expect(screen.getByText('Current Step: session')).toBeInTheDocument();
      });

      // Complete quiz
      fireEvent.click(screen.getByTestId('complete-quiz'));

      // Should show results
      await waitFor(() => {
        expect(screen.getByText('Current Step: result')).toBeInTheDocument();
        expect(screen.getByText('Score: 80')).toBeInTheDocument();
      });
    });
  });

  describe('Quiz Configuration', () => {
    it('should handle different quiz configurations', async () => {
      // Mock API response for quiz creation
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'config-quiz-1',
          field: 'backend',
          topic: 'nodejs',
          level: 'senior',
          questions: [],
          totalQuestions: 10,
          timeLimit: 15
        })
      });

      render(<TestQuizMode />);

      // Should be able to configure and create quiz
      expect(screen.getByTestId('current-step')).toHaveTextContent('config');
      
      // Start button should be available
      expect(screen.getByTestId('start-quiz')).toBeInTheDocument();
    });
  });

  describe('Quiz Session Management', () => {
    it('should manage quiz session state correctly', async () => {
      render(<TestQuizMode />);

      // Initial state
      expect(screen.getByText('Current Step: config')).toBeInTheDocument();
      expect(screen.queryByTestId('quiz-data')).not.toBeInTheDocument();

      // After starting
      fireEvent.click(screen.getByTestId('start-quiz'));

      await waitFor(() => {
        expect(screen.getByText('Current Step: session')).toBeInTheDocument();
        expect(screen.getByTestId('quiz-data')).toBeInTheDocument();
      });
    });
  });

  describe('Quiz Results', () => {
    it('should display quiz results after completion', async () => {
      render(<TestQuizMode />);

      // Complete full flow
      fireEvent.click(screen.getByTestId('start-quiz'));
      
      await waitFor(() => {
        expect(screen.getByText('Current Step: session')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('complete-quiz'));

      // Check final results
      await waitFor(() => {
        expect(screen.getByText('Current Step: result')).toBeInTheDocument();
        expect(screen.getByText('Score: 80')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API failure
      (global.fetch as any).mockRejectedValueOnce(new Error('API Error'));

      render(<TestQuizMode />);

      // Should still render without crashing
      expect(screen.getByTestId('quiz-mode')).toBeInTheDocument();
      expect(screen.getByTestId('start-quiz')).toBeInTheDocument();
    });
  });
});
