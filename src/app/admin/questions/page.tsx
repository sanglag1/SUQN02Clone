'use client';

import QuestionManager from '@/components/QuizPractice/QuestionManager';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminQuestionsPage() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
    }
  }, [isLoaded, userId, router]);

  if (!isLoaded || !userId) {
    return null;
  }

  return (
    <div>
      <QuestionManager/>
    </div>
  );
}