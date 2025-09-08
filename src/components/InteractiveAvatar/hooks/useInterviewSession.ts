import { useState, useCallback, useEffect } from 'react';

export interface InterviewSessionState {
  isInterviewComplete: boolean;
  isSubmitting: boolean;
  interviewStartTime: Date | null;
  elapsedTime: number;
}

export function useInterviewSession() {
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interviewStartTime, setInterviewStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (interviewStartTime && !isInterviewComplete) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - interviewStartTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [interviewStartTime, isInterviewComplete]);

  // Format elapsed time
  const formatElapsedTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Helper: reset session
  const resetSession = useCallback(() => {
    setIsInterviewComplete(false);
    setIsSubmitting(false);
    setInterviewStartTime(null);
    setElapsedTime(0);
  }, []);

  return {
    isInterviewComplete,
    setIsInterviewComplete,
    isSubmitting,
    setIsSubmitting,
    interviewStartTime,
    setInterviewStartTime,
    elapsedTime,
    setElapsedTime,
    formatElapsedTime,
    resetSession,
  };
} 