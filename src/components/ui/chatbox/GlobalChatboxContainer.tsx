"use client";

import React from 'react';
import { useGlobalChatbox } from '@/context/GlobalChatboxContext';
import GlobalAIChatbox from './GlobalAIChatbox';
import GlobalChatboxErrorBoundary from './GlobalChatboxErrorBoundary';
import { usePathname } from 'next/navigation';
import { useRole } from '@/context/RoleContext';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

const GlobalChatboxContainer: React.FC = () => {
  const { isOpen, toggleChatbox, currentPage, currentContext } = useGlobalChatbox();
  const pathname = usePathname();
  const { isAdmin } = useRole();

  const getPageContext = (path: string) => {
    if (path.includes('/avatar-interview')) return 'avatar-interview';
    if (path.includes('/jd')) return 'jd-analysis';
    if (path.includes('/quiz')) return 'quiz';
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/payment')) return 'payment';
    if (path.includes('/profile')) return 'profile';
    if (path.includes('/test')) return 'test';
    if (path.includes('/admin')) return 'admin';
    if (path.includes('/onboarding')) return 'onboarding';
    return 'general';
  };

  const pageContext = getPageContext(pathname);

  // Allow both admin and regular users to use chatbox
  // Only hide chatbox on specific admin pages if needed
  if (pathname && pathname.startsWith('/admin/analytics')) return null; // Hide on analytics page to avoid interference

  return (
    <>
      {/* Floating Chat Button - Facebook Messenger Style */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={toggleChatbox}
            size="lg"
            className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </Button>
        </div>
      )}

      {/* Chatbox */}
      <GlobalChatboxErrorBoundary>
        <GlobalAIChatbox
          isOpen={isOpen}
          onToggle={toggleChatbox}
          currentPage={pageContext}
          currentContext={currentContext}
        />
      </GlobalChatboxErrorBoundary>
    </>
  );
};

export default GlobalChatboxContainer;


