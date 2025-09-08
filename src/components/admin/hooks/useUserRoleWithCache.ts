'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

interface UserRole {
  isAdmin: boolean;
  isUser: boolean;
  role: 'admin' | 'user' | null;
  loading: boolean;
}

const ROLE_CACHE_KEY = 'admin_role_session'; // Use sessionStorage
const CACHE_DURATION = 3 * 60 * 1000; // Reduced to 3 minutes

interface RoleCache {
  role: string;
  timestamp: number;
  // Removed userId for security
}

export function useUserRoleWithCache(): UserRole {
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<UserRole>({
    isAdmin: false,
    isUser: false,
    role: null,
    loading: true
  });

  // Kiểm tra cache - Updated for security
  const getCachedRole = (): string | null => {
    try {
      const cached = sessionStorage.getItem(ROLE_CACHE_KEY);
      if (!cached) return null;
      
      const parsedCache: RoleCache = JSON.parse(cached);
      const now = Date.now();
      
      if ((now - parsedCache.timestamp) < CACHE_DURATION) {

        return parsedCache.role;
      }
    } catch (error) {
      console.error('Error reading role cache:', error);
    }
    return null;
  };

  // Lưu cache - Updated for security
  const setCachedRole = (role: string) => {
    try {
      const cacheData: RoleCache = {
        role,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(ROLE_CACHE_KEY, JSON.stringify(cacheData));

    } catch (error) {
      console.error('Error caching role:', error);
    }
  };

  useEffect(() => {
    const checkUserRole = async () => {
      if (!isLoaded) {

        return;
      }

      if (!user) {

        setUserRole({
          isAdmin: false,
          isUser: false,
          role: null,
          loading: false
        });
        return;
      }

      // Kiểm tra cache trước
      const cachedRole = getCachedRole();
      if (cachedRole) {
        setUserRole({
          isAdmin: cachedRole === 'admin',
          isUser: cachedRole === 'user',
          role: cachedRole as 'admin' | 'user',
          loading: false
        });
        return;
      }

      try {
        const response = await fetch(`/api/user/${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const userData = await response.json();
          const role = userData.role || 'user';
          
          // Cache the result
          setCachedRole(role);
          
          setUserRole({
            isAdmin: role === 'admin',
            isUser: role === 'user',
            role: role,
            loading: false
          });
        } else {
          
          const defaultRole = 'user';
          setCachedRole(defaultRole);
          
          setUserRole({
            isAdmin: false,
            isUser: true,
            role: defaultRole,
            loading: false
          });
        }
      } catch (error) {
        console.error('💥 Network error:', error);
        const defaultRole = 'user';
        
        setUserRole({
          isAdmin: false,
          isUser: true,
          role: defaultRole,
          loading: false
        });
      }
    };

    checkUserRole();
  }, [user, isLoaded]);

  return userRole;

  // Clear cache function (có thể export nếu cần)
  // const clearRoleCache = () => {
  //   localStorage.removeItem(ROLE_CACHE_KEY);
  // };
}
