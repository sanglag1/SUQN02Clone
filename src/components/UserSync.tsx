"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useCallback } from "react";
import { useUserSync } from "@/context/UserSyncContext";
import { useRole } from "@/context/RoleContext";

export default function UserSync() {
  const { user, isLoaded } = useUser();
  const { syncedUserIds, markUserSynced } = useUserSync();
  const { refreshRole } = useRole();
  const syncInProgress = useRef<Set<string>>(new Set());

  // Check if user was recently synced (in memory only)
  const recentSyncCache = useRef<Map<string, number>>(new Map());
  
  const isRecentlySynced = useCallback((clerkId: string) => {
    const lastSyncTime = recentSyncCache.current.get(clerkId);
    if (!lastSyncTime) return false;
    
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    return lastSyncTime > twentyFourHoursAgo;
  }, []);

  // Mark user as synced in memory only (more secure)
  const markSyncedInStorage = useCallback((clerkId: string) => {
    recentSyncCache.current.set(clerkId, Date.now());
  }, []);

  // Memoize saveUserToDB function để tránh re-create
  const saveUserToDB = useCallback(async (userData: {
    email: string;
    firstName: string;
    lastName: string;
    clerkId: string;
    avatar: string;
  }) => {
    try {
      const response = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      // Log nếu đây là user mới 
      if (result.created) {
      }
      
      // Đánh dấu user đã sync trong cả context và localStorage
      markUserSynced(userData.clerkId);
      markSyncedInStorage(userData.clerkId);
      
      // Refresh role sau khi sync (quan trọng cho admin users)
      setTimeout(refreshRole, 300);
      
      return result;
    } finally {
      syncInProgress.current.delete(userData.clerkId);
    }
  }, [markUserSynced, markSyncedInStorage, refreshRole]);

  useEffect(() => {
    // Early returns để tối ưu performance
    if (!isLoaded || !user?.id) return;
    
    const userId = user.id;
    
    // Skip nếu đã sync hoặc đang sync
    if (syncedUserIds.has(userId) || syncInProgress.current.has(userId)) return;
    
    // Skip if recently synced (within 24 hours)
    if (isRecentlySynced(userId)) {
      markUserSynced(userId); // Mark in context to avoid re-checks
      return;
    }
    
    // Validate email trước khi sync
    const email = user.emailAddresses?.[0]?.emailAddress;
    if (!email) return;

    // Mark as syncing
    syncInProgress.current.add(userId);
    
    const userData = {
      email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      clerkId: userId,
      avatar: user.imageUrl || "",
    };
    
    saveUserToDB(userData).catch(() => {
      // Error handled in saveUserToDB
    });
  }, [user, isLoaded, syncedUserIds, saveUserToDB, isRecentlySynced, markUserSynced]);

  return null;
}
