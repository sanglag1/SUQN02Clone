'use client';

import Link from 'next/link';
import { Shield, ArrowLeft, Home, AlertCircle } from 'lucide-react';

export default function AccessDenied() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-lg w-full text-center relative z-10">
        {/* Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-6 animate-bounce">
            <Shield className="w-12 h-12 text-red-600" />
          </div>
        </div>

        {/* 403 Number */}
        <div className="mb-6">
          <h1 className="text-8xl font-bold text-gray-900 mb-2 tracking-tight animate-pulse">
            403
          </h1>
          <div className="h-1 w-20 bg-gradient-to-r from-red-600 to-orange-600 mx-auto rounded-full"></div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Access Denied
        </h2>

        {/* Description */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          You don&apos;t have permission to access this page. This area is restricted to administrators only.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 transform hover:scale-105 w-full sm:w-auto shadow-lg"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Dashboard
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 transform hover:scale-105 w-full sm:w-auto"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </button>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-6 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            Quick Links
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Link
              href="/dashboard"
              className="group flex flex-col items-center justify-center px-4 py-3 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all duration-200 transform hover:scale-105"
            >
              <div className="w-3 h-3 bg-blue-500 rounded-full mb-2 group-hover:animate-pulse"></div>
              <span className="font-medium">Dashboard</span>
              <span className="text-xs text-gray-500">Overview page</span>
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
              href="/quiz"
              className="group flex flex-col items-center justify-center px-4 py-3 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-all duration-200 transform hover:scale-105"
            >
              <div className="w-3 h-3 bg-purple-500 rounded-full mb-2 group-hover:animate-pulse"></div>
              <span className="font-medium">Quiz</span>
              <span className="text-xs text-gray-500">Practice quiz</span>
            </Link>
            
            <Link
              href="/profile"
              className="group flex flex-col items-center justify-center px-4 py-3 text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-all duration-200 transform hover:scale-105"
            >
              <div className="w-3 h-3 bg-orange-500 rounded-full mb-2 group-hover:animate-pulse"></div>
              <span className="font-medium">Profile</span>
              <span className="text-xs text-gray-500">Personal info</span>
            </Link>
          </div>
        </div>

        {/* Help text */}
        <div className="mt-12 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500 mb-2">
            If you believe this is an error, please contact your administrator.
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
        <div className="absolute top-20 left-10 w-20 h-20 bg-red-200 rounded-full opacity-20 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-orange-200 rounded-full opacity-20 animate-float-delayed"></div>
        <div className="absolute top-40 right-20 w-12 h-12 bg-yellow-200 rounded-full opacity-20 animate-float-slow"></div>
        <div className="absolute bottom-40 left-20 w-14 h-14 bg-pink-200 rounded-full opacity-20 animate-float-fast"></div>
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
}
