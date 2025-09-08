import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAzureVoiceInteraction } from '@/hooks/useAzureVoiceInteraction';

// Mock the voice interaction utilities
vi.mock('@/utils/speech/voiceInteractionUtils', () => ({
  startVoiceRecognition: vi.fn(() => Promise.resolve({ id: 'recognizer-default' })),
  stopVoiceRecognition: vi.fn(() => Promise.resolve(undefined)),
}));

// Mock the Microsoft Speech SDK
vi.mock('microsoft-cognitiveservices-speech-sdk', () => ({
  default: {
    SpeechRecognizer: vi.fn(),
    SpeechConfig: vi.fn(),
    AudioConfig: vi.fn(),
  },
}));

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn(),
  },
  writable: true,
});

describe('useAzureVoiceInteraction', () => {
  const mockOnSpeechResult = vi.fn();
  const mockOnError = vi.fn();
  const mockOnInterimResult = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Get the mocked functions
    const { startVoiceRecognition, stopVoiceRecognition } = await import('@/utils/speech/voiceInteractionUtils');
    
    // Update mock implementation to store callbacks
    (startVoiceRecognition as any).mockImplementation((onResult: any, onError: any, language: any) => {
      // Store callbacks for later use in tests
      (startVoiceRecognition as any).mockCallbacks = { onResult, onError, language };
      return Promise.resolve({ id: 'recognizer-default' });
    });

    (navigator.mediaDevices.getUserMedia as any).mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() =>
        useAzureVoiceInteraction({
          onSpeechResult: mockOnSpeechResult,
        })
      );

      expect(result.current.isListening).toBe(false);
      expect(result.current.isInitializing).toBe(false);
    });

    it('should accept custom language setting', () => {
      const { result } = renderHook(() =>
        useAzureVoiceInteraction({
          onSpeechResult: mockOnSpeechResult,
          language: 'en-US',
        })
      );

      expect(result.current.isListening).toBe(false);
    });

    it('should accept custom silence timeout', () => {
      const { result } = renderHook(() =>
        useAzureVoiceInteraction({
          onSpeechResult: mockOnSpeechResult,
          silenceTimeout: 5000,
        })
      );

      expect(result.current.isListening).toBe(false);
    });
  });

  describe('Microphone Permission', () => {
    it('should check microphone permission before starting', async () => {
      const { result } = renderHook(() =>
        useAzureVoiceInteraction({
          onSpeechResult: mockOnSpeechResult,
        })
      );

      await act(async () => {
        await result.current.startListening();
      });

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
    });

    it('should handle microphone permission denied', async () => {
      (navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(new Error('Permission denied'));

      const { result } = renderHook(() =>
        useAzureVoiceInteraction({
          onSpeechResult: mockOnSpeechResult,
          onError: mockOnError,
        })
      );

      await act(async () => {
        await result.current.startListening();
      });

      expect(mockOnError).toHaveBeenCalledWith(
        'Vui lòng cho phép truy cập microphone trong cài đặt trình duyệt'
      );
    });

    it('should show English error message for English language', async () => {
      (navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(new Error('Permission denied'));

      const { result } = renderHook(() =>
        useAzureVoiceInteraction({
          onSpeechResult: mockOnSpeechResult,
          onError: mockOnError,
          language: 'en-US',
        })
      );

      await act(async () => {
        await result.current.startListening();
      });

      expect(mockOnError).toHaveBeenCalledWith(
        'Please allow microphone access in browser settings'
      );
    });
  });

  describe('Voice Recognition Control', () => {
    it('should start listening when startListening is called', async () => {
      const { result } = renderHook(() =>
        useAzureVoiceInteraction({ onSpeechResult: mockOnSpeechResult })
      );

      await act(async () => {
        await result.current.startListening();
      });

      expect(result.current.isListening).toBe(true);
    });

    it('should stop listening when stopListening is called', async () => {
      const { result } = renderHook(() =>
        useAzureVoiceInteraction({ onSpeechResult: mockOnSpeechResult })
      );

      await act(async () => {
        await result.current.startListening();
      });

      expect(result.current.isListening).toBe(true);

      await act(async () => {
        await result.current.stopListening();
      });

      expect(result.current.isListening).toBe(false);
    });

    it('should stop any existing recognizer before starting new one', async () => {
      const { result } = renderHook(() =>
        useAzureVoiceInteraction({ onSpeechResult: mockOnSpeechResult })
      );

      await act(async () => {
        await result.current.startListening();
      });

      await act(async () => {
        await result.current.startListening();
      });

      expect(result.current.isListening).toBe(true);
    });
  });

  describe('Speech Result Handling', () => {
    it('should handle final speech results', async () => {
      const { startVoiceRecognition } = await import('@/utils/speech/voiceInteractionUtils');

      const { result } = renderHook(() =>
        useAzureVoiceInteraction({
          onSpeechResult: mockOnSpeechResult,
          silenceTimeout: 1000,
        })
      );

      await act(async () => {
        await result.current.startListening();
      });

      const mockCallbacks = (startVoiceRecognition as any).mockCallbacks;
      const onResultCallback = mockCallbacks.onResult;

      act(() => {
        onResultCallback('Hello world');
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockOnSpeechResult).toHaveBeenCalledWith('Hello world');
    });

    it('should not call onInterimResult since current impl treats results as final', async () => {
      const { startVoiceRecognition } = await import('@/utils/speech/voiceInteractionUtils');

      const { result } = renderHook(() =>
        useAzureVoiceInteraction({
          onSpeechResult: mockOnSpeechResult,
          onInterimResult: mockOnInterimResult,
          silenceTimeout: 1000,
        })
      );

      await act(async () => {
        await result.current.startListening();
      });

      const mockCallbacks = (startVoiceRecognition as any).mockCallbacks;
      const onResultCallback = mockCallbacks.onResult;

      act(() => {
        onResultCallback('Hello');
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockOnInterimResult).not.toHaveBeenCalled();
      expect(mockOnSpeechResult).toHaveBeenCalledWith('Hello');
    });

    it('should accumulate speech results before sending', async () => {
      const { startVoiceRecognition } = await import('@/utils/speech/voiceInteractionUtils');

      const { result } = renderHook(() =>
        useAzureVoiceInteraction({
          onSpeechResult: mockOnSpeechResult,
          silenceTimeout: 1000,
        })
      );

      await act(async () => {
        await result.current.startListening();
      });

      const mockCallbacks = (startVoiceRecognition as any).mockCallbacks;
      const onResultCallback = mockCallbacks.onResult;

      act(() => {
        onResultCallback('Hello');
        onResultCallback('world');
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockOnSpeechResult).toHaveBeenCalledWith('Hello world');
    });
  });

  describe('Silence Timeout', () => {
    it('should send accumulated transcript after silence timeout', async () => {
      const { startVoiceRecognition } = await import('@/utils/speech/voiceInteractionUtils');

      const { result } = renderHook(() =>
        useAzureVoiceInteraction({
          onSpeechResult: mockOnSpeechResult,
          silenceTimeout: 2000,
        })
      );

      await act(async () => {
        await result.current.startListening();
      });

      const mockCallbacks = (startVoiceRecognition as any).mockCallbacks;
      const onResultCallback = mockCallbacks.onResult;

      act(() => {
        onResultCallback('Test transcript');
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(mockOnSpeechResult).toHaveBeenCalledWith('Test transcript');
    });

    it('should reset timeout when new speech is detected', async () => {
      const { startVoiceRecognition } = await import('@/utils/speech/voiceInteractionUtils');

      const { result } = renderHook(() =>
        useAzureVoiceInteraction({
          onSpeechResult: mockOnSpeechResult,
          silenceTimeout: 2000,
        })
      );

      await act(async () => {
        await result.current.startListening();
      });

      const mockCallbacks = (startVoiceRecognition as any).mockCallbacks;
      const onResultCallback = mockCallbacks.onResult;

      act(() => {
        onResultCallback('First part');
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      act(() => {
        onResultCallback('Second part');
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockOnSpeechResult).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockOnSpeechResult).toHaveBeenCalledWith('First part Second part');
    });
  });

  describe('Cleanup and Error Handling', () => {
    it('should send remaining transcript when stopping', async () => {
      const { startVoiceRecognition } = await import('@/utils/speech/voiceInteractionUtils');

      const { result } = renderHook(() =>
        useAzureVoiceInteraction({
          onSpeechResult: mockOnSpeechResult,
          silenceTimeout: 2000,
        })
      );

      await act(async () => {
        await result.current.startListening();
      });

      const mockCallbacks = (startVoiceRecognition as any).mockCallbacks;
      const onResultCallback = mockCallbacks.onResult;

      act(() => {
        onResultCallback('Remaining text');
      });

      await act(async () => {
        await result.current.stopListening();
      });

      expect(mockOnSpeechResult).toHaveBeenCalledWith('Remaining text');
    });

    it('should clear timeout when stopping recognition (still sends remaining transcript)', async () => {
      const { startVoiceRecognition } = await import('@/utils/speech/voiceInteractionUtils');

      const { result } = renderHook(() =>
        useAzureVoiceInteraction({
          onSpeechResult: mockOnSpeechResult,
          silenceTimeout: 2000,
        })
      );

      await act(async () => {
        await result.current.startListening();
      });

      const mockCallbacks = (startVoiceRecognition as any).mockCallbacks;
      const onResultCallback = mockCallbacks.onResult;

      act(() => {
        onResultCallback('Test');
      });

      await act(async () => {
        await result.current.stopListening();
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(mockOnSpeechResult).toHaveBeenCalledWith('Test');
    });

    it('should handle errors during voice recognition', async () => {
      const { startVoiceRecognition } = await import('@/utils/speech/voiceInteractionUtils');

      const { result } = renderHook(() =>
        useAzureVoiceInteraction({
          onSpeechResult: mockOnSpeechResult,
          onError: mockOnError,
        })
      );

      await act(async () => {
        await result.current.startListening();
      });

      const mockCallbacks = (startVoiceRecognition as any).mockCallbacks;
      const onErrorCallback = mockCallbacks.onError;

      act(() => {
        onErrorCallback({ message: 'Recognition error occurred' });
      });

      expect(mockOnError).toHaveBeenCalledWith('Recognition error occurred');
    });
  });

  describe('State Management', () => {
    it('should track initialization state', async () => {
      const { result } = renderHook(() =>
        useAzureVoiceInteraction({ onSpeechResult: mockOnSpeechResult })
      );

      expect(result.current.isInitializing).toBe(false);

      await act(async () => {
        await result.current.startListening();
      });

      expect(result.current.isInitializing).toBe(false);
      expect(result.current.isListening).toBe(true);
    });

    it('should maintain listening state correctly', async () => {
      const { result } = renderHook(() =>
        useAzureVoiceInteraction({ onSpeechResult: mockOnSpeechResult })
      );

      expect(result.current.isListening).toBe(false);

      await act(async () => {
        await result.current.startListening();
      });

      expect(result.current.isListening).toBe(true);

      await act(async () => {
        await result.current.stopListening();
      });

      expect(result.current.isListening).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid start/stop calls', async () => {
      const { result } = renderHook(() =>
        useAzureVoiceInteraction({ onSpeechResult: mockOnSpeechResult })
      );

      await act(async () => {
        await result.current.startListening();
        await result.current.stopListening();
        await result.current.startListening();
      });

      expect(result.current.isListening).toBe(true);
    });

    it('should handle multiple speech results in quick succession', async () => {
      const { startVoiceRecognition } = await import('@/utils/speech/voiceInteractionUtils');

      const { result } = renderHook(() =>
        useAzureVoiceInteraction({
          onSpeechResult: mockOnSpeechResult,
          silenceTimeout: 1000,
        })
      );

      await act(async () => {
        await result.current.startListening();
      });

      const mockCallbacks = (startVoiceRecognition as any).mockCallbacks;
      const onResultCallback = mockCallbacks.onResult;

      act(() => {
        onResultCallback('First');
        onResultCallback('Second');
        onResultCallback('Third');
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockOnSpeechResult).toHaveBeenCalledWith('First Second Third');
    });

    it('should handle empty speech results', async () => {
      const { startVoiceRecognition } = await import('@/utils/speech/voiceInteractionUtils');

      const { result } = renderHook(() =>
        useAzureVoiceInteraction({
          onSpeechResult: mockOnSpeechResult,
          silenceTimeout: 1000,
        })
      );

      await act(async () => {
        await result.current.startListening();
      });

      const mockCallbacks = (startVoiceRecognition as any).mockCallbacks;
      const onResultCallback = mockCallbacks.onResult;

      act(() => {
        onResultCallback('');
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockOnSpeechResult).not.toHaveBeenCalled();
    });
  });
});
