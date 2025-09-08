"use client";

import { AuthenticateWithRedirectCallback, useSignIn, useSignUp, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SSOCallback() {
  const { signIn, setActive, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const { user } = useUser();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  const saveUserToDatabase = async (userData: { 
    email: string, 
    firstName: string, 
    lastName: string, 
    clerkId: string,
    avatar?: string 
  }) => {
    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to save user data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving user to database:', error);
      throw error;
    }
  };

  // Fallback redirect after 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  useEffect(() => {
    // Lưu user vào DB sau khi xác thực thành công
    const handleCallback = async () => {
      if (!isSignInLoaded || !isSignUpLoaded) {
        return;
      }
      
      try {
        if (signUp?.status === "complete" && setActive) {
          // Save user data if available
          if (user) {
            await saveUserToDatabase({
              email: user.emailAddresses[0]?.emailAddress || '',
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              clerkId: user.id,
              avatar: user.imageUrl || ''
            });
          }
          
          await setActive({ session: signUp.createdSessionId });
          setTimeout(() => {
            router.push("/dashboard");
          }, 100);
        } else if (signIn?.status === "complete" && setActive) {
          // Save/update user data if available
          if (user) {
            await saveUserToDatabase({
              email: user.emailAddresses[0]?.emailAddress || '',
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              clerkId: user.id,
              avatar: user.imageUrl || ''
            });
          }
          
          await setActive({ session: signIn.createdSessionId });
          setTimeout(() => {
            router.push("/dashboard");
          }, 100);
        }
      } catch (error) {
        console.error("Error in callback:", error);
      }
    };

    handleCallback();
  }, [
    signIn?.status,
    signIn?.createdSessionId,
    signUp?.status,
    signUp?.createdSessionId,
    setActive,
    router,
    isSignInLoaded,
    isSignUpLoaded,
    user
  ]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
        {countdown > 0 && countdown < 5 && (
          <p className="text-sm text-gray-500 mt-2">
            Redirecting in {countdown} seconds...
          </p>
        )}
      </div>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
