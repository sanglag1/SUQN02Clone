'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export default function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const checkOnboardingStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/user/onboarding-status');
      if (response.ok) {
        const data = await response.json();
        setNeedsOnboarding(data.needsOnboarding);
        
        // Nếu user cần onboarding và không đang ở trang onboarding, redirect
        if (data.needsOnboarding && !window.location.pathname.includes('/onboarding')) {
          router.push('/onboarding');
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    checkOnboardingStatus();
  }, [isSignedIn, isLoaded, checkOnboardingStatus]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Checking...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null; // Sẽ redirect trong useEffect
  }

  if (needsOnboarding && !window.location.pathname.includes('/onboarding')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
