"use client";

import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthRedirect() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoaded) return;

    const authPages = ['/sign-in', '/sign-up', '/sso-callback'];
    const isAuthPage = authPages.some(page => pathname.startsWith(page));

    if (isSignedIn && isAuthPage) {
      router.replace('/dashboard');
    }
  }, [isSignedIn, isLoaded, pathname, router]);

  return null;
}
