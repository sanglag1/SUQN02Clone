'use client';

import React from 'react';
import BaseErrorPage from './BaseErrorPage';
import { RefreshCw, Home } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export const GlobalError: React.FC<GlobalErrorProps> = ({ error, reset }) => {
  return (
    <html>
      <body>        <BaseErrorPage
          statusCode="ERROR"
          title="Critical Error Occurred"
          description="The application encountered an unexpected error. Please try refreshing the page or return to the homepage."
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
      </body>
    </html>
  );
};

export default GlobalError;
