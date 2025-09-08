'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft, FileQuestion, AlertCircle } from 'lucide-react';

interface NotFoundPageProps {
  title?: string;
  description?: string;
  showQuickLinks?: boolean;
  primaryAction?: {
    label: string;
    href: string;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  title = "Page Not Found",
  description = "Sorry, the page you are looking for doesn't exist or has been moved. Please check the URL or return to the homepage.",
  showQuickLinks = true,
  primaryAction = {
    label: "Go Home",
    href: "/",
    icon: <Home className="w-5 h-5 mr-2" />
  },
  secondaryAction = {
    label: "Go Back",
    onClick: () => window.history.back(),
    icon: <ArrowLeft className="w-5 h-5 mr-2" />
  }
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-lg w-full text-center relative z-10">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full mb-6 animate-bounce">
            <FileQuestion className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        {/* 404 Number */}
        <div className="mb-6">
          <h1 className="text-8xl font-bold text-gray-900 mb-2 tracking-tight animate-pulse">
            404
          </h1>
          <div className="h-1 w-20 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full"></div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {title}
        </h2>

        {/* Description */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          {description}
        </p>

        {/* Action Buttons */}
        <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          <Link
            href={primaryAction.href}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105 w-full sm:w-auto shadow-lg"
          >
            {primaryAction.icon}
            {primaryAction.label}
          </Link>
          
          <button
            onClick={secondaryAction.onClick}
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 transform hover:scale-105 w-full sm:w-auto"
          >
            {secondaryAction.icon}
            {secondaryAction.label}
          </button>
        </div>

        {/* Quick Links */}
        {showQuickLinks && (
          <div className="mt-12 pt-8 border-t border-gray-200">            <p className="text-sm text-gray-500 mb-6 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              Quick Links
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">              <Link
                href="/dashboard"
                className="group flex flex-col items-center justify-center px-4 py-3 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all duration-200 transform hover:scale-105"
              >
                <div className="w-3 h-3 bg-blue-500 rounded-full mb-2 group-hover:animate-pulse"></div>
                <span className="font-medium">Dashboard</span>
                <span className="text-xs text-gray-500">Overview page</span>
              </Link>
              
              <Link
                href="/practice"
                className="group flex flex-col items-center justify-center px-4 py-3 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-all duration-200 transform hover:scale-105"
              >
                <div className="w-3 h-3 bg-purple-500 rounded-full mb-2 group-hover:animate-pulse"></div>
                <span className="font-medium">Practice</span>
                <span className="text-xs text-gray-500">Interview practice</span>
              </Link>
              
              <Link
                href="/jd"
                className="group flex flex-col items-center justify-center px-4 py-3 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-all duration-200 transform hover:scale-105"
              >
                <div className="w-3 h-3 bg-green-500 rounded-full mb-2 group-hover:animate-pulse"></div>
                <span className="font-medium">Interviews</span>
                <span className="text-xs text-gray-500">Manage interviews</span>
              </Link>
              
              <Link
                href="/profile"
                className="group flex flex-col items-center justify-center px-4 py-3 text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-all duration-200 transform hover:scale-105"
              >
                <div className="w-3 h-3 bg-orange-500 rounded-full mb-2 group-hover:animate-pulse"></div>
                <span className="font-medium">Profile</span>
                <span className="text-xs text-gray-500">Personal information</span>
              </Link>
            </div>
          </div>
        )}        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            © 2024. All rights reserved.
          </p>
          <div className="flex justify-center space-x-4 mt-2 text-xs text-gray-500">
            <Link href="/help" className="hover:text-gray-700 transition-colors">
              Help
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-gray-700 transition-colors">
              Contact
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-gray-700 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-purple-200 rounded-full opacity-20 animate-float-delayed"></div>
        <div className="absolute top-40 right-20 w-12 h-12 bg-green-200 rounded-full opacity-20 animate-float-slow"></div>
        <div className="absolute bottom-40 left-20 w-14 h-14 bg-yellow-200 rounded-full opacity-20 animate-float-fast"></div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float 6s ease-in-out infinite;
          animation-delay: 1s;
        }
        
        .animate-float-slow {
          animation: float 8s ease-in-out infinite;
          animation-delay: 2s;
        }
        
        .animate-float-fast {
          animation: float 4s ease-in-out infinite;
          animation-delay: 0.5s;
        }
      `}</style>
    </div>
  );
};

export default NotFoundPage;
