'use client';

import { ServerError } from '@/components/errors';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return <ServerError error={error} reset={reset} />;
}
