// src/contexts/AppContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactElement } from 'react';
import { ActivityType, OutputElement, ParsedCommand } from '../types/Types';
import { useCommandContext } from './CommandContext';
import { useActivityMediatorContext } from './ActivityMediatorContext';
import { parseCommand } from '../utils/commandUtils';
import { useActivityMediator } from 'src/hooks/useActivityMediator';

interface AppContextType {
  currentActivity: ActivityType;
  isLoggedIn: boolean;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  userName: string | null;
  setUserName: (userName: string | null) => void;
  outputElements: OutputElement[];
  appendToOutput: (element: OutputElement) => void;
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
  const [outputElements, setOutputElements] = useState<OutputElement[]>([]);

  const { currentActivity } = useActivityMediatorContext();
  const { handleCommandExecuted } = useActivityMediator({
    currentActivity,
  });

  const appendToOutput = useCallback((newElement: OutputElement) => {
    setOutputElements((prev) => {
      const updatedElements = [...prev, newElement];
      // Keep only the last two elements
      return updatedElements.slice(-2);
    });

  }, [handleCommandExecuted]);

  const value: AppContextType = {
    currentActivity,
    isLoggedIn,
    setIsLoggedIn,
    userName,
    setUserName,
    outputElements,
    appendToOutput,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
