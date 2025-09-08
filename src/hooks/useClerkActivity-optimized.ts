"use client";

import { useUser, useSession } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";

interface ActivityState {
  isOnline: boolean;
  lastActivity: Date;
  sessionStart: Date;
  totalTimeSpent: number;
}

export function useClerkActivityOptimized() {
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const [activityState, setActivityState] = useState<ActivityState>({
    isOnline: false,
    lastActivity: new Date(),
    sessionStart: new Date(),
    totalTimeSpent: 0
  });
  
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<Date>(new Date());
  const sessionStartRef = useRef<Date>(new Date());
  
  // Track user activity using Clerk's built-in state
  useEffect(() => {
    if (!isLoaded || !user || !session) {
      setActivityState(prev => ({ ...prev, isOnline: false }));
      return;
    }

    

    // Capture ref values at the start of effect
    const sessionStart = sessionStartRef.current;
    const getLastActivity = () => lastActivityRef.current;

    // User is online when session is active
    setActivityState(prev => ({
      ...prev,
      isOnline: true,
      sessionStart: sessionStart
    }));

    // Track activity with mouse/keyboard events (lightweight)
    const updateActivity = () => {
      lastActivityRef.current = new Date();
      setActivityState(prev => ({
        ...prev,
        lastActivity: new Date(),
        totalTimeSpent: Date.now() - sessionStart.getTime()
      }));
    };

    // Lightweight event listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });



    // Update timer every 30 seconds (instead of API calls)
    activityTimerRef.current = setInterval(() => {
      const duration = Date.now() - sessionStart.getTime();
      setActivityState(prev => ({
        ...prev,
        totalTimeSpent: duration
      }));

      // Sync with server every 2 minutes (4 timer cycles)
      if (Math.floor(duration / 30000) % 4 === 0 && duration > 60000) {
        syncActivityWithServer(user.id, duration, getLastActivity());
      }
    }, 30000);

    // Save activity data function
    const saveActivity = () => {
      const activityData = {
        userId: user.id,
        sessionDuration: Date.now() - sessionStart.getTime(),
        lastActivity: getLastActivity().toISOString()
      };
      
      
      // Save to localStorage as backup
      localStorage.setItem('lastActivity', JSON.stringify(activityData));
      
      // Optional: Send to server only when needed
      navigator.sendBeacon('/api/user/activity-summary', JSON.stringify(activityData));
    };

    // Add event listeners for saving activity
    window.addEventListener('beforeunload', saveActivity);
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveActivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      
      if (activityTimerRef.current) {
        clearInterval(activityTimerRef.current);
      }

      window.removeEventListener('beforeunload', saveActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, isLoaded, session]);

  // Helper function to sync activity with server
  const syncActivityWithServer = async (userId: string, sessionDuration: number, lastActivity: Date) => {
    try {
      const response = await fetch('/api/user/activity-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionDuration,
          lastActivity: lastActivity.toISOString()
        })
      });

      if (response.ok) {
        return true;
      } else {
        console.warn('⚠️ Activity Hook: Failed to sync with server', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Activity Hook: Error syncing with server:', error);
      return false;
    }
  };

  // Provide useful activity data without API calls
  return {
    isOnline: activityState.isOnline,
    lastActivity: activityState.lastActivity,
    sessionDuration: activityState.totalTimeSpent,
    sessionStart: activityState.sessionStart,
    
    // Helper methods
    isActiveSession: () => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current.getTime();
      return timeSinceLastActivity < 300000; // 5 minutes
    },
    
    getSessionInfo: () => ({
      userId: user?.id,
      email: user?.emailAddresses[0]?.emailAddress,
      sessionId: session?.id,
      isOnline: activityState.isOnline,
      sessionDuration: activityState.totalTimeSpent
    })
  };
}
