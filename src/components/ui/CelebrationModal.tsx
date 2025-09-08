"use client";

import { useState, useEffect, useCallback } from 'react';
import { X, Star } from 'lucide-react';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: number;
  streakCount: number;
}

export default function CelebrationModal({ 
  isOpen, 
  onClose, 
  milestone,
  streakCount
}: CelebrationModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      
      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          onClose();
        }, 300);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  const handleClose = useCallback(() => {
    console.log('🎊 CelebrationModal - Close button clicked');
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);



  const getMilestoneMessage = () => {
    switch (milestone) {
      case 3: return { title: "Awesome Start!", subtitle: "You've got a 3-streak days! 🔥", color: "from-green-400 to-green-600" };
      case 10: return { title: "Amazing!", subtitle: "10-streak days - You're doing great! 🔥", color: "from-orange-400 to-orange-600" };
      case 30: return { title: "Incredible!", subtitle: "30-streak days - You're incredible! 🔥", color: "from-blue-400 to-blue-600" };
      case 50: return { title: "Legendary!", subtitle: "50-streak days - You're legendary! 🔥", color: "from-purple-400 to-purple-600" };
      case 100: return { title: "Epic Master!", subtitle: "100-streak days - You're a master! 🔥", color: "from-yellow-400 to-yellow-600" };
      default: return { title: "Congratulations!", subtitle: `${streakCount}-streak days! 🔥`, color: "from-blue-500 to-purple-600" };
    }
  };

  const message = getMilestoneMessage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with animated gradient */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-black/70 via-purple-900/30 to-black/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleClose}
      />
      
      
      {/* Modal */}
      <div className={`relative w-full max-w-lg bg-white rounded-3xl shadow-2xl transition-all duration-300 ${
        isVisible ? 'scale-100 opacity-100 rotate-0' : 'scale-75 opacity-0 rotate-12'
      }`}>
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-50 bg-white/80 backdrop-blur-sm"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>

        {/* Header with massive animation */}
        <div className="text-center pt-8 pb-6 px-6 relative overflow-hidden rounded-t-3xl">
          {/* Background gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${message.color} opacity-5 rounded-t-3xl`} />
          
          {/* Trophy/Fire icon */}
          <div className="relative z-10">
            {/* Streak count with massive text */}
            <div className="mb-4">
              <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 animate-pulse">
                🔥 {streakCount} 🔥
              </div>
            </div>
            
            <h1 className={`text-3xl font-black bg-gradient-to-r ${message.color} bg-clip-text text-transparent mb-2 animate-pulse`}>
              {message.title}
            </h1>
            
            <p className="text-gray-700 text-lg font-semibold">
              {message.subtitle}
            </p>
            
            <p className="text-gray-500 text-sm mt-2">
              You&apos;re on your way to becoming an expert!
            </p>
          </div>
        </div>

        {/* Achievements section */}
        <div className="px-6 mb-6">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-4 border border-yellow-200">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-bold text-yellow-800">Streak Milestones</span>
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            
            <div className="flex justify-center gap-2 flex-wrap">
              {[3, 10, 30, 50, 100].map((m) => {
                const isAchieved = streakCount >= m;
                let badgeColor = 'bg-gray-100 text-gray-500';
                
                if (isAchieved) {
                  switch (m) {
                    case 3: badgeColor = 'bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg scale-110'; break;
                    case 10: badgeColor = 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-lg scale-110'; break;
                    case 30: badgeColor = 'bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-lg scale-110'; break;
                    case 50: badgeColor = 'bg-gradient-to-r from-purple-400 to-purple-600 text-white shadow-lg scale-110'; break;
                    case 100: badgeColor = 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg scale-110'; break;
                  }
                }
                
                return (
                  <div
                    key={m}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${badgeColor}`}
                  >
                    🔥 {m}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6 space-y-3">
          <button
            onClick={handleClose}
            className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r ${message.color} hover:shadow-xl text-white font-bold py-4 px-4 rounded-2xl transition-all duration-200 hover:scale-105 transform`}
          >
            Keep conquering!
          </button>    
        </div>
      </div>
    </div>
  );
}
