"use client"
import React, { useState, useEffect } from 'react';
import { VolumeX, Mic, Phone, MessageSquare, Settings } from 'lucide-react';
import { useAzureVoiceInteraction } from '@/hooks/useAzureVoiceInteraction';

// UI Components
interface ButtonProps {
  children: React.ReactNode;
  variant?: "default" | "ghost" | "outline" | "danger";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}

const Button: React.FC<ButtonProps> = ({ children, variant = "default", size = "default", className = "", onClick, disabled, ...props }) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"

  const variants = {
    default: "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500",
    ghost: "hover:bg-gray-100 hover:text-gray-900",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-50",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
  }

  const sizes = {
    default: "h-10 py-2 px-4",
    sm: "h-8 px-3 text-sm",
    lg: "h-12 px-8",
    icon: "w-12 h-12 p-0 rounded-full",
  }

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      onClick={onClick} 
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "success" | "warning";
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = "default", className = "" }) => {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    outline: "border border-gray-300 bg-transparent",
    secondary: "bg-gray-800 text-white",
    success: "bg-emerald-400 text-white",
    warning: "bg-yellow-400 text-white",
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

interface VideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  connectionQuality: string;
  sessionState: string;
  avatarId: string;
  avatarName: string;
  SessionState: {
    INACTIVE: string;
    CONNECTED: string;
    [key: string]: string;
  };
  onStopSession: () => void;
  onInterruptAvatar?: () => void;
  isAvatarTalking?: boolean;
  isInterrupting?: boolean;
  elapsedTime?: string;
  onSpeechResult: (text: string) => void;
  voiceDisabled?: boolean;
  voiceLanguage?: 'vi-VN' | 'en-US';
  // Optional tuning knobs for voice input handling
  voiceSilenceTimeoutMs?: number; // override hook silence timeout
  voiceDebounceMs?: number; // debounce before sending buffered transcript
  voiceMinWords?: number; // minimum words to accept as valid utterance
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoRef,
  connectionQuality,
  sessionState,
  avatarId,
  avatarName,
  SessionState,
  onStopSession,
  onInterruptAvatar,
  isAvatarTalking = false,
  isInterrupting: externalIsInterrupting = false,
  elapsedTime,
  onSpeechResult,
  voiceDisabled = false,
  voiceLanguage = 'vi-VN',
  voiceSilenceTimeoutMs,
  voiceDebounceMs = 700,
  voiceMinWords = 3
}) => {
  const [isEnding, setIsEnding] = useState(false);
  const [localIsInterrupting, setLocalIsInterrupting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  // VoiceInteraction state/logic
  const [error, setError] = useState<string | null>(null);
  // Buffering & debounce to avoid premature sends and reduce noise
  const speechBufferRef = React.useRef<string>("");
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  // Track latest avatar talking state to avoid stale closures
  const isAvatarTalkingRef = React.useRef<boolean>(isAvatarTalking);
  // const [interimTranscript, setInterimTranscript] = useState<string>('');
  const {
    isListening,
    isInitializing,
    startListening,
    stopListening
  } = useAzureVoiceInteraction({
    onSpeechResult: (text: string) => {
      // Ignore while avatar is talking or voice disabled (use ref to avoid stale state)
      if (voiceDisabled || isAvatarTalkingRef.current) {
        return;
      }

      const cleaned = cleanUtterance(text);
      if (!cleaned) return;

      // Append to buffer and debounce send
      const next = speechBufferRef.current ? `${speechBufferRef.current} ${cleaned}` : cleaned;
      speechBufferRef.current = next;
      scheduleBufferedSend(next);
    },
    onError: setError,
  // onInterimResult: setInterimTranscript,
    language: voiceLanguage,
    silenceTimeout: voiceSilenceTimeoutMs ?? 2000
  });

  // Utility: very simple filler/noise filtering and trimming
  const fillerWords = React.useMemo(() => new Set([
    'uh','um','erm','hmm','ờ','ừ','ừm','à','ạ','vâng','kiểu','kiểu như','kiểu là','nói chung'
  ]), []);

  const cleanUtterance = (raw: string): string => {
    if (!raw) return '';
    const normalized = raw
      .replace(/[\s]+/g, ' ')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .trim();

    if (!normalized) return '';

    // Remove standalone filler words
    const tokens = normalized
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .filter(w => !fillerWords.has(w));

    const cleaned = tokens.join(' ').trim();
    if (!cleaned) return '';

    return cleaned;
  };

  const hasSentenceEnding = (text: string): boolean => /[\.!?…]$/.test(text.trim());

  const scheduleBufferedSend = (bufferSnapshot: string) => {
    // If avatar started talking, do not schedule anything
    if (isAvatarTalkingRef.current) return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      // Do not send if avatar started talking meanwhile
      if (isAvatarTalkingRef.current) return;

      const words = bufferSnapshot.trim().split(/\s+/).filter(Boolean);
      if (words.length < voiceMinWords && !hasSentenceEnding(bufferSnapshot)) {
        // Not confident it's a complete thought yet
        return;
      }

      // Flush then immediately stop listening to prevent overlap with avatar response
      const finalText = bufferSnapshot.trim();
      if (finalText) {
        onSpeechResult(finalText);
      }
      speechBufferRef.current = "";
      // Proactively stop the microphone after sending user utterance
      stopListening().catch(() => {});
    }, voiceDebounceMs);
  };
  const toggleMicrophone = async () => {
    if (voiceDisabled) return;
    // Prevent starting mic while avatar is speaking
    if (isAvatarTalkingRef.current) {
      setError('Microphone is disabled while avatar is speaking');
      setTimeout(() => setError(null), 2000);
      return;
    }
    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  };

  // Auto-manage microphone based on avatar talking state
  useEffect(() => {
    isAvatarTalkingRef.current = isAvatarTalking;
    const handleAvatarTalkingChange = async () => {
      if (isAvatarTalking) {
        // Stop listening when avatar starts talking
        if (isListening) {
          console.log('Auto-stopping microphone: Avatar started talking');
          await stopListening();
        }
        // Also clear any pending buffered send when avatar speaks
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        speechBufferRef.current = "";
      }
      // Note: We don't auto-start listening when avatar stops talking
      // to give user control over when they want to speak
    };

    handleAvatarTalkingChange();
  }, [isAvatarTalking, isListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Show visual feedback when microphone is disabled due to avatar talking
  const getMicrophoneStatus = () => {
    if (isAvatarTalking) {
      return {
        status: 'disabled',
        message: 'Microphone disabled - Avatar is speaking',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        iconColor: 'text-amber-500'
      };
    } else if (isListening) {
      return {
        status: 'active',
        message: 'Listening for your voice...',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        iconColor: 'text-green-500'
      };
    } else {
      return {
        status: 'inactive',
        message: 'Click microphone to start speaking',
        color: 'text-gray-500',
        bgColor: 'bg-gray-50',
        iconColor: 'text-gray-400'
      };
    }
  };

  const microphoneStatus = getMicrophoneStatus();
 
  // Use external isInterrupting state if available, otherwise use local state
  const isInterrupting = externalIsInterrupting || localIsInterrupting;

  const handleOpenConfirm = () => {
    if (isEnding) return;
    setShowConfirm(true);
  };

  const handleConfirmEnd = async () => {
    if (isEnding) return;
    try {
      setIsEnding(true);
      console.log('VideoPlayer: User confirmed session end');
      await onStopSession();
      console.log('VideoPlayer: Session ended successfully');
    } catch (error) {
      console.error('VideoPlayer: Error ending session:', error);
    } finally {
      setIsEnding(false);
      setShowConfirm(false);
    }
  };

  const handleCancelEnd = () => {
    if (isEnding) return;
    setShowConfirm(false);
  };

  const handleInterruptSpeech = React.useCallback(async () => {
    if (isInterrupting || !onInterruptAvatar) return; // Prevent double-click
    
    try {
      // Use local state only if external state is not provided
      if (!externalIsInterrupting) {
        setLocalIsInterrupting(true);
      }

      await onInterruptAvatar();

    } catch (error) {
      console.error('VideoPlayer: Error interrupting avatar speech:', error);
    } finally {
      // Reset local state only if external state is not provided
      if (!externalIsInterrupting) {
        setLocalIsInterrupting(false);
      }
    }
  }, [isInterrupting, onInterruptAvatar, externalIsInterrupting]);

  // Keyboard shortcut to interrupt avatar speech (ESC key)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isAvatarTalking && !isInterrupting && onInterruptAvatar) {
        event.preventDefault();
        handleInterruptSpeech();
      }
    };

    // Only add listener when avatar is talking and connected
    if (isAvatarTalking && sessionState === SessionState.CONNECTED) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAvatarTalking, isInterrupting, sessionState, SessionState.CONNECTED, onInterruptAvatar, handleInterruptSpeech]);

  return (
    <div className="flex flex-col lg:flex-1">
      {/* Mobile responsive padding */}
      <div className="px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-4 bg-gradient-to-br from-slate-50 to-gray-100 shrink-0">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm shadow-xl border-0 overflow-hidden">
          <div className="p-0 relative">
            <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden relative">
              {sessionState === SessionState.INACTIVE ? (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <h6 className="text-lg sm:text-xl font-semibold px-4 text-center">
                    Avatar {avatarId} ready to start
                  </h6>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}

              {/* Top-left: Main participant info - Mobile responsive */}
              <div className="absolute top-2 sm:top-6 left-2 sm:left-6">
                <div className="flex items-center gap-2 sm:gap-3 bg-white/10 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full backdrop-blur-md border border-white/20">
                  <div className="relative flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 overflow-hidden rounded-full bg-white/10 text-white/80 text-xs sm:text-sm items-center justify-center">
                    {avatarName?.[0] ?? 'A'}
                  </div>
                  <span className="text-xs sm:text-sm font-medium hidden sm:block">{avatarName}</span>
                  {sessionState === SessionState.CONNECTED}
                  {elapsedTime && (
                    <Badge variant="outline" className="ml-1 sm:ml-2 text-white border-white/30 text-xs">
                      {elapsedTime}
                    </Badge>
                  )}
                  {sessionState === SessionState.CONNECTED && connectionQuality !== 'UNKNOWN' && (
                    <Badge variant="outline" className="ml-1 sm:ml-2 text-white border-white/30 text-xs hidden sm:block">
                      {connectionQuality}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Bottom-center: Control bar - Mobile responsive */}
              <div className="absolute bottom-2 sm:bottom-6 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center gap-1 sm:gap-3 bg-white/10 px-3 sm:px-6 py-2 sm:py-3 rounded-full backdrop-blur-md border border-white/20">
                  {isAvatarTalking && onInterruptAvatar && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="text-white hover:bg-white/20 w-8 h-8 sm:w-12 sm:h-12"
                      onClick={handleInterruptSpeech}
                      disabled={isInterrupting}
                      title="Stop avatar speaking (ESC)"
                    >
                      {isInterrupting ? (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </Button>
                  )}

                  <Button 
                    size="icon" 
                    variant={isListening ? "default" : "ghost"}
                    className={`${isListening ? 'bg-green-500 hover:bg-green-600' : 'text-white hover:bg-white/20'} ${isAvatarTalking ? 'opacity-50' : ''} w-8 h-8 sm:w-12 sm:h-12`}
                    onClick={toggleMicrophone}
                    disabled={voiceDisabled || isAvatarTalking || isInitializing}
                    title={
                      isAvatarTalking 
                        ? 'Microphone disabled - Avatar is speaking' 
                        : isListening 
                          ? 'Stop speaking' 
                          : 'Start speaking'
                    }
                  >
                    {isInitializing ? (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : isListening ? (
                      <div className="relative">
                        <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse"></div>
                      </div>
                    ) : (
                      <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </Button>

                  <Button 
                    size="icon" 
                    variant="danger"
                    onClick={handleOpenConfirm}
                    disabled={isEnding}
                    title="End call"
                    className="w-8 h-8 sm:w-12 sm:h-12"
                  >
                    {isEnding ? (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </Button>

                  {/* Hide less important buttons on mobile */}
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-white hover:bg-white/20 w-8 h-8 sm:w-12 sm:h-12 hidden sm:block"
                    onClick={() => {}}
                    title="Messages"
                  >
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>

                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-white hover:bg-white/20 w-8 h-8 sm:w-12 sm:h-12 hidden sm:block"
                    onClick={() => {}}
                    title="Settings"
                  >
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
                {error && (
                  <div className="mt-2 text-center text-red-500 text-xs px-2">{error}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Conversation Section - Mobile responsive */}
      <div className="lg:flex-1 px-3 sm:px-6 pb-2 sm:pb-6 bg-gradient-to-br from-slate-50 to-gray-100 lg:overflow-y-auto">
        <div className="bg-white rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
            </div>
            <span className="text-xs sm:text-sm font-semibold text-gray-700">Live Conversation</span>
          </div>
          <div className="space-y-2">
            <p className="text-gray-800 leading-relaxed font-medium text-sm sm:text-base">
              {isAvatarTalking ? "Avatar is speaking..." : "Ready for your response..."}
            </p>
            
            {/* Voice interaction status */}
            <div className={`flex items-center gap-2 text-xs sm:text-sm p-2 sm:p-3 rounded-lg ${microphoneStatus.bgColor}`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${microphoneStatus.status === 'active' ? 'bg-green-500' : microphoneStatus.status === 'disabled' ? 'bg-amber-500' : 'bg-gray-400'}`}></div>
              <span className={microphoneStatus.color}>{microphoneStatus.message}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm End Session Modal - Mobile responsive */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm sm:text-base">!
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">End interview session?</h3>
                <p className="mt-1 text-xs sm:text-sm text-gray-600">You can start again anytime. This will disconnect the current call.</p>
              </div>
            </div>
            <div className="mt-4 sm:mt-6 flex gap-2 sm:gap-3">
              <Button variant="outline" className="flex-1 text-sm" onClick={handleCancelEnd} disabled={isEnding}>Cancel</Button>
              <Button variant="danger" className="flex-1 text-sm" onClick={handleConfirmEnd} disabled={isEnding}>
                {isEnding ? 'Ending...' : 'End Session'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
