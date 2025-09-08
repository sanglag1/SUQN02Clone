"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GlobalChatboxContextType {
  isOpen: boolean;
  currentPage: string;
  currentContext: any;
  openChatbox: (page?: string, context?: any) => void;
  closeChatbox: () => void;
  toggleChatbox: () => void;
  updateContext: (context: any) => void;
}

const GlobalChatboxContext = createContext<GlobalChatboxContextType | undefined>(undefined);

export const useGlobalChatbox = () => {
  const context = useContext(GlobalChatboxContext);
  if (context === undefined) {
    throw new Error('useGlobalChatbox must be used within a GlobalChatboxProvider');
  }
  return context;
};

interface GlobalChatboxProviderProps {
  children: ReactNode;
}

export const GlobalChatboxProvider: React.FC<GlobalChatboxProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('general');
  const [currentContext, setCurrentContext] = useState({});

  const openChatbox = (page: string = 'general', context: any = {}) => {
    setCurrentPage(page);
    setCurrentContext(context);
    setIsOpen(true);
  };

  const closeChatbox = () => {
    setIsOpen(false);
  };

  const toggleChatbox = () => {
    setIsOpen(!isOpen);
  };

  const updateContext = (context: any) => {
    setCurrentContext(prev => ({ ...prev, ...context }));
  };

  const value: GlobalChatboxContextType = {
    isOpen,
    currentPage,
    currentContext,
    openChatbox,
    closeChatbox,
    toggleChatbox,
    updateContext,
  };

  return (
    <GlobalChatboxContext.Provider value={value}>
      {children}
    </GlobalChatboxContext.Provider>
  );
};
