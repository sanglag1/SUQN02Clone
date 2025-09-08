'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';

interface AvatarCardProps {
  user: {
    imageUrl?: string;
  } | null;
  firstName: string;
  lastName: string;
  onAvatarChange?: () => void;
}

export const AvatarCard: React.FC<AvatarCardProps> = ({
  user,
  firstName,
  lastName,
  onAvatarChange
}) => {
  const { user: clerkUser } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || 'U';
  };


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !clerkUser) return;

    // Validate file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File size too large. Please upload an image smaller than 10MB.');
      return;
    }

    setIsUploading(true);
    try {
      await clerkUser.setProfileImage({ file });
      if (onAvatarChange) {
        onAvatarChange();
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleChangeAvatar = () => {
    fileInputRef.current?.click();
  };return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <div className="text-center">
        <div className="relative inline-block">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 p-1 shadow-2xl hover:shadow-3xl transition-all duration-300">
            <div className="w-full h-full rounded-full overflow-hidden bg-white">
              {user?.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt="Profile"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                  {getInitials(firstName, lastName)}
                </div>
              )}
            </div>
          </div>
          
          {/* Loading overlay */}
          {isUploading && (
            <div className="absolute inset-0 w-32 h-32 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
          
          {/* Camera Icon */}
          <button
            onClick={handleChangeAvatar}
            disabled={isUploading}
            className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-lg">📷</span>
          </button>
        </div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        <div className="mt-6">
          <p className="text-sm text-gray-500 mt-1">
            {isUploading ? 'Uploading...' : 'Click camera to update photo'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AvatarCard;
