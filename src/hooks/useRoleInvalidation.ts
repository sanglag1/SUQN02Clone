'use client';

import { useEffect } from 'react';
import { useRole } from '@/context/RoleContext';
import { useUser } from '@clerk/nextjs';

const ROLE_INVALIDATION_KEY = 'role_invalidation_signal';

export function useRoleInvalidation() {
  const { refreshRole, invalidateRoleCache } = useRole();
  const { user } = useUser();

  // Listen for role invalidation signals
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ROLE_INVALIDATION_KEY && user) {
        try {
          const data = JSON.parse(e.newValue || '{}');
          
          // If this signal is for current user, refresh role immediately
          if (data.clerkId === user.id) {
            invalidateRoleCache();
            refreshRole();
          }
        } catch (error) {
          console.error('Error parsing role invalidation signal:', error);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [user, refreshRole, invalidateRoleCache]);

  // Function to broadcast role invalidation signal
  const broadcastRoleInvalidation = (clerkId: string) => {
    if (typeof window !== 'undefined') {
      const signal = {
        clerkId,
        timestamp: Date.now()
      };
      
      // Set the signal
      localStorage.setItem(ROLE_INVALIDATION_KEY, JSON.stringify(signal));
      
      // Thêm debounce để tránh multiple rapid broadcasts
      const timeoutId = setTimeout(() => {
        // Immediately trigger storage event for same tab
        window.dispatchEvent(new StorageEvent('storage', {
          key: ROLE_INVALIDATION_KEY,
          newValue: JSON.stringify(signal),
          oldValue: null,
          storageArea: localStorage
        }));
      }, 50); // 50ms delay để tránh rapid successive calls
      
      // Remove the signal after a short delay to clean up
      setTimeout(() => {
        localStorage.removeItem(ROLE_INVALIDATION_KEY);
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  };

  return {
    broadcastRoleInvalidation
  };
}
