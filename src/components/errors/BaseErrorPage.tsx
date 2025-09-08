'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface BaseErrorPageProps {
  title?: string;
  statusCode?: string | number;
  description?: string;
  error?: Error & { digest?: string };
  showErrorDetails?: boolean;
  showRecoveryActions?: boolean;
  onReset?: () => void;
  primaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
  };
}

export const BaseErrorPage: React.FC<BaseErrorPageProps> = ({  title = "An Error Occurred",
  statusCode = "500",
  description = "Sorry, an error occurred. Please try refreshing the page or return to the homepage.",
  error,
  showErrorDetails = false,
  showRecoveryActions = true,
  onReset,
  primaryAction = {
    label: "Try Again",
    onClick: () => window.location.reload(),
    icon: <RefreshCw className="w-5 h-5 mr-2" />
  },
  secondaryAction = {
    label: "Go Home",
    href: "/",
    icon: <Home className="w-5 h-5 mr-2" />
  }
}) => {
  React.useEffect(() => {
    if (error) {
      console.error('Application error:', error);
    }
  }, [error]);

  const getStatusCodeColor = () => {
    const code = String(statusCode);
    if (code.startsWith('4')) return 'text-orange-600';
    if (code.startsWith('5')) return 'text-red-600';
    return 'text-gray-600';
  };

  const getBackgroundGradient = () => {
    const code = String(statusCode);
    if (code.startsWith('4')) return 'from-orange-50 via-white to-yellow-50';
    if (code.startsWith('5')) return 'from-red-50 via-white to-orange-50';
    return 'from-gray-50 via-white to-blue-50';
  };

  const getIconColor = () => {
    const code = String(statusCode);
    if (code.startsWith('4')) return 'bg-orange-100 text-orange-600';
    if (code.startsWith('5')) return 'bg-red-100 text-red-600';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBackgroundGradient()} flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden`}>
      <div className="max-w-lg w-full text-center relative z-10">
        {/* Error Icon */}
        <div className="mb-8">
          <div className={`inline-flex items-center justify-center w-24 h-24 ${getIconColor()} rounded-full mb-6 animate-bounce`}>
            <AlertTriangle className="w-12 h-12" />
          </div>
        </div>

        {/* Status Code */}
        <div className="mb-6">
          <h1 className={`text-6xl font-bold ${getStatusCodeColor()} mb-2 tracking-tight`}>
            {statusCode}
          </h1>
          <div className={`h-1 w-20 bg-gradient-to-r ${statusCode.toString().startsWith('4') ? 'from-orange-600 to-yellow-600' : 'from-red-600 to-orange-600'} mx-auto rounded-full`}></div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {title}
        </h2>

        {/* Description */}
        <div className="text-gray-600 mb-8 leading-relaxed">
          <p className="mb-4">{description}</p>
          
          {/* Error Details */}
          {showErrorDetails && error && process.env.NODE_ENV === 'development' && (            <details className="text-left bg-gray-50 rounded-lg p-4 mb-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                <Bug className="w-4 h-4 inline mr-2" />
                Error Details (development mode)
              </summary>
              <div className="mt-3 text-xs text-gray-600 font-mono bg-white p-3 rounded border overflow-auto max-h-32">
                <p><strong>Error:</strong> {error.message}</p>
                {error.digest && (
                  <p><strong>Digest:</strong> {error.digest}</p>
                )}
                {error.stack && (
                  <pre className="mt-2 text-xs overflow-auto">
                    {error.stack.split('\n').slice(0, 5).join('\n')}
                  </pre>
                )}
              </div>
            </details>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          {/* Primary Action */}
          {primaryAction.href ? (
            <Link
              href={primaryAction.href}
              className={`inline-flex items-center justify-center px-6 py-3 ${statusCode.toString().startsWith('4') ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'} text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 w-full sm:w-auto shadow-lg`}
            >
              {primaryAction.icon}
              {primaryAction.label}
            </Link>
          ) : (
            <button
              onClick={primaryAction.onClick || onReset}
              className={`inline-flex items-center justify-center px-6 py-3 ${statusCode.toString().startsWith('4') ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'} text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 w-full sm:w-auto shadow-lg`}
            >
              {primaryAction.icon}
              {primaryAction.label}
            </button>
          )}
          
          {/* Secondary Action */}
          {secondaryAction.href ? (
            <Link
              href={secondaryAction.href}
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 transform hover:scale-105 w-full sm:w-auto"
            >
              {secondaryAction.icon}
              {secondaryAction.label}
            </Link>
          ) : (
            <button
              onClick={secondaryAction.onClick}
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 transform hover:scale-105 w-full sm:w-auto"
            >
              {secondaryAction.icon}
              {secondaryAction.label}
            </button>
          )}
        </div>        {/* Contact Support */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 mb-2">
            If the error continues, please contact us
          </p>
          <div className="space-x-4">
            <Link href="/contact" className="text-sm text-blue-600 hover:text-blue-800 underline">
              Report Error
            </Link>
            <span className="text-gray-400">•</span>
            <Link href="/help" className="text-sm text-blue-600 hover:text-blue-800 underline">
              Help
            </Link>
          </div>
        </div>        {/* Quick Recovery Actions */}
        {showRecoveryActions && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">You can try:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </button>
              
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.href = '/';
                }}
                className="flex items-center justify-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Reset & Go Home
              </button>
            </div>
          </div>
        )}        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            © 2024. All rights reserved.
          </p>
        </div>
      </div>

      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-20 h-20 ${statusCode.toString().startsWith('4') ? 'bg-orange-200' : 'bg-red-200'} rounded-full opacity-20 animate-pulse`}></div>
        <div className={`absolute bottom-20 right-10 w-16 h-16 ${statusCode.toString().startsWith('4') ? 'bg-yellow-200' : 'bg-orange-200'} rounded-full opacity-20 animate-pulse`} style={{animationDelay: '1s'}}></div>
        <div className="absolute top-40 right-20 w-12 h-12 bg-gray-200 rounded-full opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
    </div>
  );
};

export default BaseErrorPage;
