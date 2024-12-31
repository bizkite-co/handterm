// src/contexts/AppContext.tsx
import type React from 'react';
import { createContext, useContext, useState } from 'react';

import { type ActivityType, type OutputElement } from '../types/Types';

import { useActivityMediatorContext } from './ActivityMediatorContext';

interface AppContextType {
  currentActivity: ActivityType;
  isLoggedIn: boolean;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  userName: string | null;
  setUserName: (userName: string | null) => void;
  outputElements: OutputElement[];
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [outputElements] = useState<OutputElement[]>([]);

  const { currentActivity } = useActivityMediatorContext();

  const value: AppContextType = {
    currentActivity,
    isLoggedIn,
    setIsLoggedIn,
    userName,
    setUserName,
    outputElements,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
