'use client';

import React from 'react';

interface ProfileHeaderProps {
  title: string;
  description: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ title, description }) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      <p className="text-gray-600 mt-2">{description}</p>
    </div>
  );
};

export default ProfileHeader;
