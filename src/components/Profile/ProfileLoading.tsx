'use client';

import React from 'react';

interface ProfileLoadingProps {
  isAuthenticating?: boolean;
}

export const ProfileLoading: React.FC<ProfileLoadingProps> = ({ isAuthenticating = false }) => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="flex flex-col items-center space-y-6">
            {/* Enhanced Spinner */}
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
            </div>
              {/* Loading text with subtle animation */}
            <div className="text-center">
              <p className="text-gray-700 text-lg font-medium">
                {isAuthenticating ? 'Authenticating...' : 'Loading profile...'}
              </p>
              <div className="flex justify-center mt-2 space-x-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileLoading;
