'use client';

import QuestionManager from '@/components/QuizPractice/QuestionManager';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminQuestionsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/question-bank/questions');
  }, [router]);
  return null;
}