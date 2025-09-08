'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { SecurityCleanup } from '@/utils/securityCleanup';

// Định nghĩa interface cho User
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role?: string;
  clerkId?: string;
}

// Định nghĩa interface cho AuthContext
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

// Tạo Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut } = useClerkAuth();
  const router = useRouter();

  // Đồng bộ với Clerk user
  useEffect(() => {
    const syncWithClerk = async () => {
      if (!clerkLoaded) {
        setIsLoading(true);
        return;
      }

      if (clerkUser) {
        // Nếu có Clerk user, tạo user object từ Clerk data
        const userData: User = {
          id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          firstName: clerkUser.firstName || undefined,
          lastName: clerkUser.lastName || undefined,
          avatar: clerkUser.imageUrl || undefined,
          clerkId: clerkUser.id,
        };

        // Fetch thêm thông tin user từ database nếu cần
        try {
          const response = await fetch('/api/profile', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const dbUser = await response.json();
            // Merge Clerk data với database data
            setUser({
              ...userData,
              ...dbUser,
              role: dbUser.role || 'user', // Ensure role is a string, not an object
            });
          } else {
            // Nếu không có trong database, chỉ dùng Clerk data
            setUser(userData);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUser(userData);
        }
      } else {
        // Nếu không có Clerk user, clear context
        setUser(null);
      }

      setIsLoading(false);
    };

    syncWithClerk();
  }, [clerkUser, clerkLoaded]);

  // Hàm login (có thể được gọi sau khi Clerk authentication thành công)
  const login = (userData: User) => {
    setUser(userData);
    
    // Không lưu vào localStorage nữa để bảo mật
    // localStorage.setItem('user', JSON.stringify(userData)); // ❌ Không làm này nữa
    

  };

  // Hàm logout
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Clear context
      setUser(null);
      
      // Comprehensive security cleanup
      SecurityCleanup.onLogout();
      
      // Sign out từ Clerk
      await signOut();
      
      // Điều hướng về trang login
      router.push('/sign-in');
      

    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm update user
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);

    }
  };

  // Hàm refresh user data từ API
  const refreshUser = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(prevUser => ({
          ...prevUser!,
          ...userData,
          role: userData.role || 'user', // Ensure role is a string, not an object
        }));

      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading: isLoading || !clerkLoaded,
    isAuthenticated: !!user && !!clerkUser,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook để sử dụng AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export default UserSync component (để compatibility với code cũ)
export default function UserSync({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}