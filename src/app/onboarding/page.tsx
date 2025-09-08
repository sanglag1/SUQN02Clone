'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import OnboardingSteps from '@/components/OnboardingSteps/OnboardingSteps';

export default function OnboardingPage() {
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
        
        if (!data.needsOnboarding) {
          // Nếu không cần onboarding, chuyển về dashboard
          router.push('/dashboard');
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
      router.push('/sign-in');
      return;
    }

    checkOnboardingStatus();
  }, [isSignedIn, isLoaded, router, checkOnboardingStatus]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null; // Sẽ redirect trong useEffect
  }

  if (!needsOnboarding) {
    return null; // Sẽ redirect trong useEffect
  }

  return <OnboardingSteps />;
}
