"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useUser } from "@clerk/nextjs";

interface UserRole {
  isAdmin: boolean;
  isUser: boolean;
  role: 'admin' | 'user' | null;
  loading: boolean;
}

interface RoleContextType extends UserRole {
  refreshRole: () => Promise<void>;
  invalidateRoleCache: () => void;
}

const ROLE_CACHE_KEY = 'user_role_session'; // Changed from v3 to session
const ROLE_INVALIDATION_KEY = 'role_invalidation_signal';
const CACHE_DURATION = 5 * 60 * 1000; // Reduced from 15 to 5 minutes

interface RoleCache {
  role: string;
  timestamp: number;
  // Removed userId for security - don't store user identifiers
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<UserRole>({
    isAdmin: false,
    isUser: false,
    role: null,
    loading: true
  });

  // Memoized cache functions - Updated for security  
  const getCachedRole = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const cached = sessionStorage.getItem(ROLE_CACHE_KEY); // Use sessionStorage
      if (!cached) return null;
      
      const parsedCache: RoleCache = JSON.parse(cached);
      const isExpired = (Date.now() - parsedCache.timestamp) >= CACHE_DURATION;
      
      if (!isExpired) { // Don't check userId - just timestamp for security
        return parsedCache.role;
      }
    } catch (error) {
      console.error('Error reading role cache:', error);
    }
    return null;
  }, []);

  const setCachedRole = useCallback((role: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheData: RoleCache = {
        role,
        timestamp: Date.now()
        // No userId stored for security
      };
      sessionStorage.setItem(ROLE_CACHE_KEY, JSON.stringify(cacheData)); // Use sessionStorage
    } catch (error) {
      console.error('Error caching role:', error);
    }
  }, []);

  const invalidateRoleCache = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.removeItem(ROLE_CACHE_KEY); // Use sessionStorage
      localStorage.removeItem('user_role_cache_v3'); // Cleanup old cache
    } catch (error) {
      console.error('Error invalidating role cache:', error);
    }
  }, []);

  // Optimized fetch role function with faster endpoint
  const fetchRole = useCallback(async (userId: string): Promise<string> => {
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      // Only set timeout if signal is not already aborted
      if (!controller.signal.aborted) {
        timeoutId = setTimeout(() => {
          if (!controller.signal.aborted) {
            controller.abort();
          }
        }, 8000); // 8s timeout
      }
      
      // Use the faster role-only endpoint
      const response = await fetch(`/api/user/${userId}/role`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      // Clear timeout only if it was set
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (response.ok) {
        const userData = await response.json();
        return userData.role || 'user';
      } else if (response.status === 404) {
        // User not found, they might be new - default to user
        console.warn('User not found in database, defaulting to user role');
        return 'user';
      }
      
      console.warn(`Role API returned ${response.status}, defaulting to user role`);
      return 'user';
    } catch (error) {
      // Clear timeout in catch block as well
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Role fetch was aborted (timeout or cancelled) - defaulting to user role');
      } else {
        console.warn('Role fetch error:', error);
      }
      return 'user'; // Always return a default instead of throwing
    }
  }, []);

  // Optimized refresh role function with fallback
  const refreshRole = useCallback(async () => {
    if (!user?.id) return;
    
    setUserRole(prev => ({ ...prev, loading: true }));
    
    try {
      // First try the fast role endpoint
      let role = await fetchRole(user.id);
      
      // If that fails, try to get from cache or use default
      if (!role || role === 'user') {
        const cachedRole = getCachedRole();
        if (cachedRole && cachedRole !== 'user') {
          role = cachedRole;
        }
      }
      
      setCachedRole(role);
      
      setUserRole({
        isAdmin: role === 'admin',
        isUser: role === 'user',
        role: role as 'admin' | 'user',
        loading: false
      });
    } catch (error) {
      // Don't log abort errors as they are expected during cleanup
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error refreshing role:', error);
      }
      
      // Try to use cached role as fallback
      const cachedRole = getCachedRole();
      if (cachedRole) {
        setUserRole({
          isAdmin: cachedRole === 'admin',
          isUser: cachedRole === 'user',
          role: cachedRole as 'admin' | 'user',
          loading: false
        });
      } else {
        // Final fallback to user role
        setUserRole({
          isAdmin: false,
          isUser: true,
          role: 'user',
          loading: false
        });
      }
    }
  }, [user?.id, fetchRole, setCachedRole, getCachedRole]);

  // Main effect to check user role with improved error handling
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    
    const checkUserRole = async () => {
      if (!isLoaded || !isMounted) return;

      if (!user) {
        if (isMounted) {
          setUserRole({
            isAdmin: false,
            isUser: false,
            role: null,
            loading: false
          });
        }
        return;
      }

      // Try cache first
      const cachedRole = getCachedRole();
      if (cachedRole && isMounted) {
        setUserRole({
          isAdmin: cachedRole === 'admin',
          isUser: cachedRole === 'user',
          role: cachedRole as 'admin' | 'user',
          loading: false
        });
        
        // Still fetch in background to update cache, but don't wait
        if (!abortController.signal.aborted) {
          fetchRole(user.id).then(freshRole => {
            if (freshRole !== cachedRole && isMounted && !abortController.signal.aborted) {
              setCachedRole(freshRole);
              setUserRole({
                isAdmin: freshRole === 'admin',
                isUser: freshRole === 'user',
                role: freshRole as 'admin' | 'user',
                loading: false
              });
            }
          }).catch(() => {
            if (!abortController.signal.aborted) {       
            }
          });
        }
        
        return;
      }

      // No cache, fetch from API with timeout protection
      if (isMounted) {
        setUserRole(prev => ({ ...prev, loading: true }));
      }
      
      try {
        // Check if we should still proceed
        if (!isMounted || abortController.signal.aborted) return;
        
        // Use fetchRole which already has proper timeout handling
        const role = await fetchRole(user.id);
        
        // Check again before setting state
        if (isMounted && !abortController.signal.aborted) {
          setCachedRole(role);
          
          setUserRole({
            isAdmin: role === 'admin',
            isUser: role === 'user',
            role: role as 'admin' | 'user',
            loading: false
          });
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Error checking role:', error);
          
          // Default to user role but don't show loading forever
          if (isMounted) {
            setUserRole({
              isAdmin: false,
              isUser: true,
              role: 'user',
              loading: false
            });
          }
        }
      }
    };

    checkUserRole();

    // Cleanup function
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [user, isLoaded, getCachedRole, fetchRole, setCachedRole]);

  // Listen to storage events for role updates and invalidation signals
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!user) return;
      
      // Handle role cache updates from other tabs
      if (e.key === ROLE_CACHE_KEY) {
        const cachedRole = getCachedRole();
        if (cachedRole) {
          setUserRole({
            isAdmin: cachedRole === 'admin',
            isUser: cachedRole === 'user',
            role: cachedRole as 'admin' | 'user',
            loading: false
          });
        }
      }
      
      // Handle role invalidation signals - chỉ refresh khi thực sự cần thiết
      if (e.key === ROLE_INVALIDATION_KEY && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          
          // If this signal is for current user, refresh role immediately
          if (data.clerkId === user.id) {
            // Immediately invalidate cache
            invalidateRoleCache();
            
            // Thêm debounce để tránh refresh quá nhiều lần
            const timeoutId = setTimeout(() => {
              refreshRole().then(() => {
                // Role refresh completed
              });
            }, 100); // 100ms delay để tránh multiple rapid calls
            
            return () => clearTimeout(timeoutId);
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
  }, [user, getCachedRole, invalidateRoleCache, refreshRole]);

  return (
    <RoleContext.Provider 
      value={{
        ...userRole,
        refreshRole,
        invalidateRoleCache
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
