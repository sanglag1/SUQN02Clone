'use client';

import { GlobalError } from '@/components/errors';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorPage({ error, reset }: GlobalErrorProps) {
  return <GlobalError error={error} reset={reset} />;
}
