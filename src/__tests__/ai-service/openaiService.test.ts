import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { ChatMessage } from '../../services/openaiService';

// Mock environment variables
const originalEnv = process.env;

describe('openaiService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
    
    // Set up environment variables for testing
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_AZURE_OPENAI_KEY: 'test-key-123',
      NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT: 'https://test-endpoint.openai.azure.com',
      NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT: 'gpt-4.0'
    };
    
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('callOpenAI', () => {
    it('should call Azure OpenAI API successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'This is a test response from AI'
            }
          }
        ]
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const { callOpenAI } = await import('../../services/openaiService');
      
      const messages: ChatMessage[] = [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello' }
      ];

      const result = await callOpenAI(messages);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-endpoint.openai.azure.com/openai/deployments/gpt-4.0/chat/completions?api-version=2024-04-01-preview',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': 'test-key-123'
          },
          body: JSON.stringify({
            messages,
            max_tokens: 1024,
            temperature: 0.7,
            stream: false
          })
        })
      );
    });

    it('should throw error when API key is missing', async () => {
      delete process.env.NEXT_PUBLIC_AZURE_OPENAI_KEY;
      vi.resetModules();

      const { callOpenAI } = await import('../../services/openaiService');
      
      const messages: ChatMessage[] = [{ role: 'user', content: 'Hello' }];

      await expect(callOpenAI(messages)).rejects.toThrow('Azure OpenAI key or endpoint is missing');
    });

    it('should throw error when endpoint is missing', async () => {
      delete process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT;
      vi.resetModules();

      const { callOpenAI } = await import('../../services/openaiService');
      
      const messages: ChatMessage[] = [{ role: 'user', content: 'Hello' }];

      await expect(callOpenAI(messages)).rejects.toThrow('Azure OpenAI key or endpoint is missing');
    });

    it('should handle API error responses', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Unauthorized access'
      });

      const { callOpenAI } = await import('../../services/openaiService');
      
      const messages: ChatMessage[] = [{ role: 'user', content: 'Hello' }];

      await expect(callOpenAI(messages)).rejects.toThrow('Azure OpenAI API error: 401 Unauthorized');
    });

    it('should handle invalid response structure', async () => {
      const invalidResponse = { choices: [] }; // Missing message content

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => invalidResponse
      });

      const { callOpenAI } = await import('../../services/openaiService');
      
      const messages: ChatMessage[] = [{ role: 'user', content: 'Hello' }];

      await expect(callOpenAI(messages)).rejects.toThrow('Invalid response structure from Azure OpenAI');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const { callOpenAI } = await import('../../services/openaiService');
      
      const messages: ChatMessage[] = [{ role: 'user', content: 'Hello' }];

      await expect(callOpenAI(messages)).rejects.toThrow('Failed to call Azure OpenAI: Network error');
    });

    it('should use custom deployment name when provided', async () => {
      process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT = 'custom-model';
      vi.resetModules();

      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Test response'
            }
          }
        ]
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const { callOpenAI } = await import('../../services/openaiService');
      
      const messages: ChatMessage[] = [{ role: 'user', content: 'Hello' }];

      await callOpenAI(messages);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/openai/deployments/custom-model/'),
        expect.any(Object)
      );
    });

    it('should handle empty messages array', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Empty messages response'
            }
          }
        ]
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const { callOpenAI } = await import('../../services/openaiService');
      
      const messages: ChatMessage[] = [];

      const result = await callOpenAI(messages);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            messages: [],
            max_tokens: 1024,
            temperature: 0.7,
            stream: false
          })
        })
      );
    });
  });
});
