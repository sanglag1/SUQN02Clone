"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

interface UserSyncContextType {
  syncedUserIds: Set<string>;
  markUserSynced: (userId: string) => void;
}

const UserSyncContext = createContext<UserSyncContextType | undefined>(undefined);

export const UserSyncProvider = ({ children }: { children: ReactNode }) => {
  // Chỉ lưu trong memory, không localStorage để bảo mật
  const [syncedUserIds, setSyncedUserIds] = useState<Set<string>>(new Set());

  const markUserSynced = (userId: string) => {
    setSyncedUserIds(prev => {
      const newSet = new Set(prev);
      newSet.add(userId);
      return newSet;
    });
  };

  return (
    <UserSyncContext.Provider value={{ syncedUserIds, markUserSynced }}>
      {children}
    </UserSyncContext.Provider>
  );
};

export const useUserSync = () => {
  const context = useContext(UserSyncContext);
  if (!context) {
    throw new Error("useUserSync must be used within a UserSyncProvider");
  }
  return context;
};
