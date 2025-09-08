"use client";

import { useState, useEffect, useCallback } from 'react';
import { X, Zap, Target } from 'lucide-react';
import Link from 'next/link';

interface ActivityReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProgress?: {
    streak: number;
    completedToday: number;
    totalTarget: number;
  };
}

export default function ActivityReminderModal({ 
  isOpen, 
  onClose, 
  userProgress = { streak: 0, completedToday: 0, totalTarget: 10 }
}: ActivityReminderModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 200);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md bg-white rounded-2xl shadow-2xl transition-all duration-200 ${
        isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Header with Animation */}
        <div className="text-center pt-8 pb-6 px-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
            <Zap className="w-10 h-10 text-white animate-pulse" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🔥 {userProgress.streak > 0 ? `Maintain your ${userProgress.streak}-streak days!` : 'Start your streak!'}
          </h2>
          
          <p className="text-gray-600 text-sm">
            {userProgress.streak > 0 
              ? `You have a ${userProgress.streak}-streak days! Keep going to maintain it.`
              : 'You haven\'t had any activity today. Start now to build your streak and improve your skills!'
            }
          </p>
        </div>

        {/* Progress Stats */}
        <div className="px-6 mb-6">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  🔥
                </div>
                <span className="text-sm font-medium text-gray-700">Current Streak</span>
              </div>
              <span className="text-lg font-bold text-orange-500">
                {userProgress.streak} days
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Today&apos;s Progress</span>
              </div>
              <span className="text-lg font-bold text-blue-500">
                {userProgress.completedToday}/{userProgress.totalTarget}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(userProgress.completedToday / userProgress.totalTarget) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6 space-y-3">
          <Link
            href="/quiz"
            onClick={handleClose}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
          >
                Try Interview AI
          </Link>
          
          <Link
            href="/avatar-interview"
            onClick={handleClose}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl border border-gray-200 transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
          >  
            Start Quiz Now
          </Link>
        </div>
      </div>
    </div>
  );
}
