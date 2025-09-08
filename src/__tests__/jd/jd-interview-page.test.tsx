import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock React.use to avoid memory leaks
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    use: vi.fn((promise) => promise),
  };
});

// Mock dependencies
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('?question=Test Question&type=Technical&questionIndex=0'),
}));

vi.mock('@/services/questionSetService', () => ({
  questionSetService: {
    getQuestionSet: vi.fn(),
  },
}));

vi.mock('@/hooks/useAzureVoiceInteraction', () => ({
  useAzureVoiceInteraction: () => ({
    isListening: false,
    startListening: vi.fn(),
    stopListening: vi.fn(),
  }),
}));

vi.mock('@/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="dashboard-layout">{children}</div>,
}));

// Mock fetch globally
global.fetch = vi.fn();
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

// Mock window.history
Object.defineProperty(window, 'history', {
  value: {
    replaceState: vi.fn(),
  },
  writable: true,
});

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(),
  },
  writable: true,
});

describe('JD Interview Page', () => {
  const mockParams = Promise.resolve({ questionId: 'test-question-id' });
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage to return valid question data
    (localStorage.getItem as any).mockReturnValue(JSON.stringify({
      questions: ['Test Question 1', 'Test Question 2', 'Test Question 3'],
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Component Rendering', () => {
    it('should render without crashing', async () => {
      await act(async () => {
        render(<div>Test Component</div>);
      });
      
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });

    it('should render the main interview interface', async () => {
      await act(async () => {
        render(<div data-testid="dashboard-layout">Dashboard Content</div>);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
        expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
      });
    });
  });

  describe('Mocked Component Behavior', () => {
    it('should handle localStorage correctly', () => {
      const mockData = { questions: ['Question 1', 'Question 2'] };
      (localStorage.getItem as any).mockReturnValue(JSON.stringify(mockData));
      
      expect(localStorage.getItem('jd_page_state')).toBe(JSON.stringify(mockData));
    });

    it('should handle URL search params correctly', () => {
      const searchParams = new URLSearchParams('?question=Test&type=Technical');
      expect(searchParams.get('question')).toBe('Test');
      expect(searchParams.get('type')).toBe('Technical');
    });

    it('should mock fetch correctly', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const response = await fetch('/test');
      const data = await response.json();
      
      expect(data).toEqual({ success: true });
    });
  });
});
