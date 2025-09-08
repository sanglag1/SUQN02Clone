'use client';

import React from 'react';

interface QuickActionsProps {
  onLogout: () => void;
  onChangePassword?: () => void;
  onExportData?: () => void;
  onDeleteAccount?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onLogout,
  onChangePassword,
  onExportData,
  onDeleteAccount
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
          <span className="text-white text-lg">⚡</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
      </div>
      
      <div className="space-y-3">
        {onChangePassword && (
          <button 
            onClick={onChangePassword}
            className="w-full px-4 py-3 text-left text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-200 border border-blue-200 hover:border-blue-300"
          >
            🔒 Change Password
          </button>
        )}
        
        {onExportData && (
          <button 
            onClick={onExportData}
            className="w-full px-4 py-3 text-left text-sm font-medium text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition-all duration-200 border border-green-200 hover:border-green-300"
          >
            📊 Export Data
          </button>
        )}
        
        <button 
          onClick={onLogout}
          className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200 border border-red-200 hover:border-red-300"
        >
          🚪 Sign Out
        </button>
        
        {onDeleteAccount && (
          <div className="pt-4 border-t border-gray-200">
            <button 
              onClick={onDeleteAccount}
              className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200 border border-red-200 hover:border-red-300"
            >
              🗑️ Delete Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickActions;
