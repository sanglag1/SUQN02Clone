import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

interface OnboardingStatus {
  needsOnboarding: boolean;
  isNewUser: boolean;
  onboardingCompleted: boolean;
  user: {
    id: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    [key: string]: unknown;
  } | null;
}

export const useOnboardingCheck = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);

  const checkOnboardingStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/user/onboarding-status');
      if (response.ok) {
        const data = await response.json();
        setOnboardingStatus(data);
        
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

  const refreshOnboardingStatus = useCallback(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  return {
    loading,
    onboardingStatus,
    needsOnboarding: onboardingStatus?.needsOnboarding || false,
    isNewUser: onboardingStatus?.isNewUser || false,
    onboardingCompleted: onboardingStatus?.onboardingCompleted || false,
    refreshOnboardingStatus
  };
};
