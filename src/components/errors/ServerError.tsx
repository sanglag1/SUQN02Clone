'use client';

import React from 'react';
import BaseErrorPage from './BaseErrorPage';
import { RefreshCw, Home } from 'lucide-react';

interface ServerErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export const ServerError: React.FC<ServerErrorProps> = ({ error, reset }) => {
  return (    <BaseErrorPage
      statusCode="500"
      title="Server Error Occurred"
      description="Sorry, the server encountered an internal error. Please try refreshing the page or return to the homepage."
      error={error}
      showErrorDetails={true}
      showRecoveryActions={true}
      onReset={reset}
      primaryAction={{
        label: "Try Again",
        onClick: reset,
        icon: <RefreshCw className="w-5 h-5 mr-2" />
      }}
      secondaryAction={{
        label: "Go Home",
        href: "/",
        icon: <Home className="w-5 h-5 mr-2" />
      }}
    />
  );
};

export default ServerError;
