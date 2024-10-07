// src/contexts/AppContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { ActivityType } from '../types/Types';
import { useCommandContext } from './CommandContext';
import { useActivityMediatorContext } from './ActivityMediatorContext';

interface AppContextType {
  currentActivity: ActivityType;
  setCurrentActivity: (activity: ActivityType) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  userName: string | null;
  setUserName: (userName: string | null) => void;
  outputElements: React.ReactNode[];
  appendToOutput: (element: React.ReactNode) => void;
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
  const [currentActivity, setCurrentActivity] = useState<ActivityType>(ActivityType.NORMAL);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [outputElements, setOutputElements] = useState<React.ReactNode[]>([]);

  const { handleCommandExecuted } = useActivityMediatorContext();

  const appendToOutput = useCallback((element: React.ReactNode) => {
    console.log('AppContext: appendToOutput called with', element);
    if (Array.isArray(element)) {
      setOutputElements(prev => [...prev, ...element]);
    } else {
      setOutputElements(prev => [...prev, element]);
    }
    // Call handleCommandExecuted if the element is a command output
    if (React.isValidElement(element) && element.props['data-status'] !== undefined) {
      const command = element.props.children[0].props.children[3]; // Assuming the command is the fourth child of the first child
      console.log('AppContext: Calling handleCommandExecuted with:', command);
      handleCommandExecuted(command);
    }
  }, [handleCommandExecuted]);

  const value = {
    currentActivity,
    setCurrentActivity,
    isLoggedIn,
    setIsLoggedIn,
    userName,
    setUserName,
    outputElements,
    appendToOutput,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
