"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useCallback } from "react";

const ACTIVITY_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

export function useActivityHeartbeat() {
  const { user, isLoaded } = useUser();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  const updateActivity = useCallback(async (retryCount = 0) => {
    if (!user?.id) return;

    try {
      const response = await fetch('/api/user/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        retryCountRef.current = 0; // Reset retry count on success
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.warn('Failed to update user activity:', error);
      
      // Retry logic
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          updateActivity(retryCount + 1);
        }, RETRY_DELAY * (retryCount + 1)); // Exponential backoff
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isLoaded || !user?.id) {
      return;
    }

    // Initial update
    updateActivity();

    // Set up interval
    intervalRef.current = setInterval(() => {
      updateActivity();
    }, ACTIVITY_UPDATE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user?.id, isLoaded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}
