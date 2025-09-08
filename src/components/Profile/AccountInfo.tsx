'use client';

import React from 'react';

interface AccountInfoProps {
  accountData: {
    joinDate: string;
    lastLogin: string;
    status: string;
  };
}

export const AccountInfo: React.FC<AccountInfoProps> = ({ accountData }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <h3 className="text-xl font-bold text-gray-900">Account Information</h3>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
          <span className="text-sm font-medium text-gray-700">Member Since:</span>
          <span className="text-sm font-bold text-gray-900">{accountData.joinDate}</span>
        </div>

        <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl border border-green-100">
          <span className="text-sm font-medium text-gray-700">Last Login:</span>
          <span className="text-sm font-bold text-gray-900">{accountData.lastLogin}</span>
        </div>

        <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            {accountData.status}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AccountInfo;
