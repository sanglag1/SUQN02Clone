'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading?: boolean;
}

export default function ConfirmDeleteModal({ 
  user, 
  isOpen, 
  onClose, 
  onConfirm, 
  loading = false 
}: ConfirmDeleteModalProps) {
  if (!isOpen || !user) return null;


  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Background overlay with blur - should show blurred content behind */}
      <div 
        className="fixed inset-0 backdrop-blur-sm bg-white/20" 
        onClick={onClose}
      ></div>

      {/* Modal container */}
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Modal content */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full mr-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Delete</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3">
              Are you sure you want to delete ? This action cannot be undone.
            </p>
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-sm font-medium text-gray-900">
                {user.fullName || `${user.firstName} ${user.lastName}`}
              </p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </div>
              ) : (
                'Delete User'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document body level
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
