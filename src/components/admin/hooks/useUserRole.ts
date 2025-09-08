'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

interface UserRole {
  isAdmin: boolean;
  isUser: boolean;
  role: 'admin' | 'user' | null;
  loading: boolean;
}

export function useUserRole(): UserRole {
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<UserRole>({
    isAdmin: false,
    isUser: false,
    role: null,
    loading: true
  });
  const [retryCount, setRetryCount] = useState(0);

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
          setUserRole({
            isAdmin: role === 'admin',
            isUser: role === 'user',
            role: role,
            loading: false
          });
          setRetryCount(0);
        } else {
          await response.json();
          if (response.status === 404 && retryCount < 2) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 1000);
            return;
          }
          setUserRole({
            isAdmin: false,
            isUser: true,
            role: 'user',
            loading: false
          });
        }
      } catch {
        if (retryCount < 2) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1500);
          return;
        }
        setUserRole({
          isAdmin: false,
          isUser: true,
          role: 'user',
          loading: false
        });
      }
    };

    checkUserRole();
  }, [user, isLoaded, retryCount]);

  return userRole;
}
