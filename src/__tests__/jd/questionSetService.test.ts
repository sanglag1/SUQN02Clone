import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { questionSetService, QuestionSetService, QuestionSetData, SaveQuestionSetRequest } from '@/services/questionSetService';

// Mock fetch globally
global.fetch = vi.fn();

describe('QuestionSetService', () => {
  let service: QuestionSetService;
  
  beforeEach(() => {
    vi.clearAllMocks();
    service = new QuestionSetService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('saveQuestionSet', () => {
    const mockQuestionSetData: SaveQuestionSetRequest = {
      jobTitle: 'Frontend Developer',
      questionType: 'technical',
      level: 'mid',
      questions: [
        'What is React?',
        'Explain the virtual DOM',
        'What are hooks in React?'
      ],
      fileName: 'frontend-dev-jd.pdf'
    };

    it('should successfully save a question set', async () => {
      const mockResponse = {
        questionSet: {
          id: 'question-set-123',
          ...mockQuestionSetData,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await service.saveQuestionSet(mockQuestionSetData);

      expect(global.fetch).toHaveBeenCalledWith('/api/jd/question-sets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockQuestionSetData),
      });
      expect(result).toEqual(mockResponse.questionSet);
    });

    it('should handle server error responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Internal server error' })
      });

      await expect(service.saveQuestionSet(mockQuestionSetData)).rejects.toThrow('Internal server error');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(service.saveQuestionSet(mockQuestionSetData)).rejects.toThrow('Network error');
    });
  });

  describe('getAllQuestionSets', () => {
    it('should successfully fetch all question sets', async () => {
      const mockQuestionSets: QuestionSetData[] = [
        {
          id: 'set-1',
          jobTitle: 'Frontend Developer',
          questionType: 'technical',
          level: 'mid',
          questions: ['Question 1', 'Question 2'],
          fileName: 'frontend-dev.pdf',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'set-2',
          jobTitle: 'Backend Developer',
          questionType: 'technical',
          level: 'senior',
          questions: ['Question 3', 'Question 4'],
          fileName: 'backend-dev.pdf',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, questionSets: mockQuestionSets })
      });

      const result = await service.getAllQuestionSets();

      expect(global.fetch).toHaveBeenCalledWith('/api/jd/question-sets');
      expect(result).toEqual(mockQuestionSets);
    });

    it('should handle server error responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Internal server error' })
      });

      await expect(service.getAllQuestionSets()).rejects.toThrow('Internal server error');
    });

    it('should handle invalid response format', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false })
      });

      await expect(service.getAllQuestionSets()).rejects.toThrow('Invalid response format from server');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getAllQuestionSets()).rejects.toThrow('Network error');
    });

    it('should handle JSON parsing errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      });

      await expect(service.getAllQuestionSets()).rejects.toThrow('Invalid JSON');
    });
  });

  describe('getQuestionSet', () => {
    it('should successfully fetch a specific question set', async () => {
      const mockQuestionSet: QuestionSetData = {
        id: 'set-123',
        jobTitle: 'Frontend Developer',
        questionType: 'technical',
        level: 'mid',
        questions: ['Question 1', 'Question 2'],
        fileName: 'frontend-dev.pdf',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, questionSet: mockQuestionSet })
      });

      const result = await service.getQuestionSet('set-123');

      expect(global.fetch).toHaveBeenCalledWith('/api/jd/question-sets/set-123');
      expect(result).toEqual(mockQuestionSet);
    });

    it('should handle 404 not found error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Not Found' })
      });

      await expect(service.getQuestionSet('non-existent')).rejects.toThrow('Question set not found. It may have been deleted or you may not have access to it.');
    });

    it('should handle other server error responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Internal server error' })
      });

      await expect(service.getQuestionSet('set-123')).rejects.toThrow('Internal server error');
    });

    it('should handle invalid response format', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false })
      });

      await expect(service.getQuestionSet('set-123')).rejects.toThrow('Invalid response format from server');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getQuestionSet('set-123')).rejects.toThrow('Network error');
    });
  });

  describe('deleteQuestionSet', () => {
    it('should successfully delete a question set', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await service.deleteQuestionSet('set-123');

      expect(global.fetch).toHaveBeenCalledWith('/api/jd/question-sets/set-123', {
        method: 'DELETE',
      });
    });

    it('should handle server error responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Internal server error' })
      });

      await expect(service.deleteQuestionSet('set-123')).rejects.toThrow('Internal server error');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(service.deleteQuestionSet('set-123')).rejects.toThrow('Network error');
    });
  });

  describe('Service Configuration', () => {
    it('should create new instance correctly', () => {
      const newService = new QuestionSetService();
      expect(newService).toBeInstanceOf(QuestionSetService);
    });
  });

  describe('Data Validation', () => {
    it('should validate question set data structure', () => {
      const validData: SaveQuestionSetRequest = {
        jobTitle: 'Developer',
        questionType: 'technical',
        level: 'junior',
        questions: ['Question 1'],
        fileName: 'developer-jd.pdf'
      };

      expect(validData).toHaveProperty('jobTitle');
      expect(validData).toHaveProperty('questionType');
      expect(validData).toHaveProperty('level');
      expect(validData).toHaveProperty('questions');
      expect(validData).toHaveProperty('fileName');
      expect(Array.isArray(validData.questions)).toBe(true);
      expect(validData.questions.length).toBeGreaterThan(0);
    });

    it('should validate question set response structure', () => {
      const validResponse: QuestionSetData = {
        id: 'set-123',
        jobTitle: 'Developer',
        questionType: 'technical',
        level: 'junior',
        questions: ['Question 1'],
        fileName: 'developer-jd.pdf',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(validResponse).toHaveProperty('id');
      expect(validResponse).toHaveProperty('jobTitle');
      expect(validResponse).toHaveProperty('questionType');
      expect(validResponse).toHaveProperty('level');
      expect(validResponse).toHaveProperty('questions');
      expect(validResponse).toHaveProperty('fileName');
      expect(validResponse).toHaveProperty('createdAt');
      expect(validResponse).toHaveProperty('updatedAt');
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle null error response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: null,
        json: () => Promise.resolve({ error: null })
      });

      await expect(service.getAllQuestionSets()).rejects.toThrow('Failed to fetch question sets (500)');
    });

    it('should handle undefined error response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: undefined,
        json: () => Promise.resolve({})
      });

      await expect(service.getAllQuestionSets()).rejects.toThrow('Failed to fetch question sets (500)');
    });

    it('should handle empty error response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: '',
        json: () => Promise.resolve({})
      });

      await expect(service.getAllQuestionSets()).rejects.toThrow('Failed to fetch question sets (500)');
    });
  });

  describe('Network Resilience', () => {
    it('should handle timeout scenarios', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('timeout'));

      await expect(service.getAllQuestionSets()).rejects.toThrow('timeout');
    });

    it('should handle connection refused errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('ECONNREFUSED'));

      await expect(service.getAllQuestionSets()).rejects.toThrow('ECONNREFUSED');
    });

    it('should handle malformed URL errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Invalid URL'));

      await expect(service.getAllQuestionSets()).rejects.toThrow('Invalid URL');
    });
  });

  describe('Response Processing', () => {
    it('should handle empty question sets array', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, questionSets: [] })
      });

      const result = await service.getAllQuestionSets();
      expect(result).toEqual([]);
    });

    it('should handle single question set', async () => {
      const singleQuestionSet: QuestionSetData = {
        id: 'single-set',
        jobTitle: 'Developer',
        questionType: 'technical',
        level: 'junior',
        questions: ['Single question'],
        fileName: 'developer-jd.pdf',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, questionSet: singleQuestionSet })
      });

      const result = await service.getQuestionSet('single-set');
      expect(result).toEqual(singleQuestionSet);
    });

    it('should handle large question sets', async () => {
      const largeQuestionSet: QuestionSetData = {
        id: 'large-set',
        jobTitle: 'Senior Developer',
        questionType: 'technical',
        level: 'senior',
        questions: Array.from({ length: 100 }, (_, i) => `Question ${i + 1}`),
        fileName: 'large-jd.pdf',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, questionSet: largeQuestionSet })
      });

      const result = await service.getQuestionSet('large-set');
      expect(result.questions).toHaveLength(100);
      expect(result.questions[0]).toBe('Question 1');
      expect(result.questions[99]).toBe('Question 100');
    });
  });

  describe('HTTP Method Validation', () => {
    it('should use POST method for saving', async () => {
      const mockResponse = { questionSet: { id: 'new-set', jobTitle: 'Developer' } };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await service.saveQuestionSet({
        jobTitle: 'Developer',
        questionType: 'technical',
        level: 'junior',
        questions: ['Question 1'],
        fileName: 'developer-jd.pdf'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/jd/question-sets',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should use GET method for fetching', async () => {
      const mockResponse = { success: true, questionSets: [{ id: 'set-1', jobTitle: 'Developer' }] };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await service.getAllQuestionSets();

      expect(global.fetch).toHaveBeenCalledWith('/api/jd/question-sets');
    });

    it('should use DELETE method for deletion', async () => {
      const mockResponse = { success: true };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await service.deleteQuestionSet('set-123');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/jd/question-sets/set-123',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Header Validation', () => {
    it('should set correct Content-Type header for POST requests', async () => {
      const mockResponse = { questionSet: { id: 'new-set' } };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await service.saveQuestionSet({
        jobTitle: 'Developer',
        questionType: 'technical',
        level: 'junior',
        questions: ['Question 1'],
        fileName: 'developer-jd.pdf'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/jd/question-sets',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    it('should not set Content-Type header for GET requests', async () => {
      const mockResponse = { success: true, questionSets: [{ id: 'set-1' }] };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await service.getAllQuestionSets();

      expect(global.fetch).toHaveBeenCalledWith('/api/jd/question-sets');
    });

    it('should not set Content-Type header for DELETE requests', async () => {
      const mockResponse = { success: true };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await service.deleteQuestionSet('set-123');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/jd/question-sets/set-123',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});

