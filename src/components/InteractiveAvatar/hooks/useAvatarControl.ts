import { useRef, useState, useCallback } from 'react';
import StreamingAvatar, {
  StreamingEvents,
  StartAvatarRequest,
  TaskType
} from '@heygen/streaming-avatar';

// Define event types
type StreamReadyEvent = CustomEvent<MediaStream>;
type UserTalkingMessageEvent = CustomEvent<{ text: string }>;
type UserEndMessageEvent = CustomEvent<{ text: string }>;
type AvatarEndMessageEvent = CustomEvent<{ text: string }>;
type ConnectionQualityChangedEvent = CustomEvent<string>;
import { SessionState } from '../HeygenConfig';

interface UseAvatarControlProps {
  onAvatarTalkingChange: (isTalking: boolean) => void;
  onConnectionQualityChange: (quality: string) => void;
  onTranscriptUpdate: (text: string) => void;
  onTranscriptFinalize: (text: string) => void;
  onTranscriptStart: () => void;
  onAvatarMessage: (text: string) => void;
  onError: (message: string) => void;
}

export const useAvatarControl = ({
  onAvatarTalkingChange,
  onConnectionQualityChange,
  onTranscriptUpdate,
  onTranscriptFinalize,
  onTranscriptStart,
  onAvatarMessage,
  onError
}: UseAvatarControlProps) => {
  const [sessionState, setSessionState] = useState<SessionState>(SessionState.INACTIVE);
  const [isInterrupting, setIsInterrupting] = useState(false);
  const avatarRef = useRef<StreamingAvatar>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Store event handlers for cleanup reference
  const eventHandlers = useRef<Record<string, unknown>>({});

  const fetchAccessToken = async () => {
    try {
      const response = await fetch('/api/heygen-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        throw new Error('Failed to get token');
      }
      const token = await response.text();
      return token;
    } catch (error) {
      console.error('Error fetching token:', error);
      throw error;
    }
  };
  // Initialize avatar with event handlers
  const initAvatar = useCallback(async (token: string): Promise<StreamingAvatar> => {
    try {
      const avatar = new StreamingAvatar({
        token,
        basePath: process.env.NEXT_PUBLIC_BASE_API_URL || 'https://api.heygen.com'
      });      avatar.on(StreamingEvents.STREAM_READY, (event: StreamReadyEvent) => {
        
        if (videoRef.current && event.detail) {
          videoRef.current.srcObject = event.detail;
          setSessionState(SessionState.CONNECTED);
        }
      });

      avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          setSessionState(SessionState.INACTIVE);
        }
      });

      avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
        onAvatarTalkingChange(true);
      });

      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        onAvatarTalkingChange(false);
      });

      avatar.on(StreamingEvents.CONNECTION_QUALITY_CHANGED, (e: ConnectionQualityChangedEvent) => {
        onConnectionQualityChange(e.detail);
      });

      avatar.on(StreamingEvents.USER_START, () => {
        onTranscriptStart();
      });

      avatar.on(StreamingEvents.USER_TALKING_MESSAGE, (event: UserTalkingMessageEvent) => {
        onTranscriptUpdate(event.detail.text);
      });

      avatar.on(StreamingEvents.USER_END_MESSAGE, (event: UserEndMessageEvent) => {
        if (event.detail.text) {
          onTranscriptFinalize(event.detail.text);
        }
      });

      avatar.on(StreamingEvents.AVATAR_END_MESSAGE, (event: AvatarEndMessageEvent) => {
        if (event.detail.text) {
          onAvatarMessage(event.detail.text);
        }
      });

      avatar.on('error', (error) => {
        console.error('Avatar error:', error);
        onError(error.message);
        setSessionState(SessionState.INACTIVE);
      });

      avatarRef.current = avatar;
      return avatar;
    } catch (error) {
      console.error('Error initializing avatar:', error);
      throw error;
    }
  }, [
    onAvatarTalkingChange,
    onConnectionQualityChange,
    onTranscriptStart,
    onTranscriptUpdate,
    onTranscriptFinalize,
    onAvatarMessage,
    onError
  ]);
  const startSession = useCallback(async (config: StartAvatarRequest) => {
    try {
      setSessionState(SessionState.CONNECTING);
      const token = await fetchAccessToken();
      const avatar = await initAvatar(token);
      
     
      await avatar.createStartAvatar(config);
      
      // Don't return avatar instance since we manage it internally
      return;
    } catch (error) {
      console.error('Error starting session:', error);
      setSessionState(SessionState.INACTIVE);
      throw error;
    }
  }, [initAvatar]);

  const endSession = useCallback(async () => {
    try {
      
      onAvatarTalkingChange(false);

      // Step 2: Clean up media stream before stopping avatar
      if (videoRef.current && videoRef.current.srcObject) {
        
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => {
          track.stop();
          
        });
        videoRef.current.srcObject = null;
      }

      // Step 3: Stop avatar properly (like in sample code)
      if (avatarRef.current) {
        
        try {
          await avatarRef.current.stopAvatar();
        
        } catch (stopError) {
          console.warn('Error stopping avatar, but continuing cleanup:', stopError);
        }
        
        // Clear the reference (like in sample code)
        avatarRef.current = null;
      }

      // Step 4: Clear event handlers reference
      eventHandlers.current = {};

      // Step 5: Set session state to inactive (like in sample code)
      setSessionState(SessionState.INACTIVE);
      
      
    } catch (error) {
      console.error('Error ending session:', error);
      // Even if there's an error, ensure we reset the session state
      setSessionState(SessionState.INACTIVE);
      onAvatarTalkingChange(false);
      throw error;
    }
  }, [onAvatarTalkingChange]);

  const speakText = useCallback(async (text: string) => {
    if (avatarRef.current) {
      await avatarRef.current.speak({
        text,
        taskType: TaskType.REPEAT
      });
    }
  }, []);

  const interruptAvatar = useCallback(async () => {
    // Prevent multiple interruptions
    if (isInterrupting) {
      
      return;
    }

    try {
      setIsInterrupting(true);
      
      if (avatarRef.current) {
        
        
        // First, try to use the interrupt method
        try {
          await avatarRef.current.interrupt();
          
        } catch (interruptError) {
          console.warn('Interrupt method failed, trying alternative approach:', interruptError);
          
          // Alternative: Force stop by manually triggering avatar stop event
          onAvatarTalkingChange(false);
          
          // Try to speak empty text to stop current speech
          try {
            await avatarRef.current.speak({
              text: '',
              taskType: TaskType.REPEAT
            });
          } catch (speakError) {
            console.warn('Fallback speak method also failed:', speakError);
          }
        }
        
        // Ensure avatar talking state is reset
        onAvatarTalkingChange(false);
        
        
      } else {
        
        onError('Cannot interrupt avatar: not connected');
      }
    } catch (error) {
      
      onError('Failed to interrupt avatar speech: ' + (error instanceof Error ? error.message : String(error)));
      
      // Ensure state is reset even on error
      onAvatarTalkingChange(false);
      throw error;
    } finally {
      setIsInterrupting(false);
    }
  }, [isInterrupting, onAvatarTalkingChange, onError]);

  // Convenient method specifically for stopping avatar speech
  const stopAvatarSpeaking = useCallback(async () => {
    try {
      
      await interruptAvatar();
      
    } catch (error) {
      console.error('Hook: Error stopping avatar speech:', error);
      // Don't re-throw to prevent breaking the UI
    }
  }, [interruptAvatar]);

  // Check if avatar can be interrupted
  const canInterrupt = useCallback(() => {
    return avatarRef.current !== null && !isInterrupting && sessionState === SessionState.CONNECTED;
  }, [isInterrupting, sessionState]);

  // Force stop avatar speech with immediate effect
  const forceStopSpeaking = useCallback(async () => {
    try {
      
      
      // Immediately set avatar talking to false
      onAvatarTalkingChange(false);
      
      if (avatarRef.current) {
        // Try interrupt first
        try {
          await avatarRef.current.interrupt();
        } catch (error) {
          console.warn('Force interrupt failed, using empty speak:', error);
          // Fallback: speak empty text
          await avatarRef.current.speak({
            text: '',
            taskType: TaskType.REPEAT
          });
        }
      }
      
      
    } catch (error) {
      console.error('Hook: Error force stopping avatar speech:', error);
      // Ensure state is reset
      onAvatarTalkingChange(false);
    }
  }, [onAvatarTalkingChange]);

  return {
    sessionState,
    videoRef,
    startSession,
    endSession,
    speakText,
    interruptAvatar,
    stopAvatarSpeaking,
    forceStopSpeaking,
    canInterrupt,
    isInterrupting
  };
};
