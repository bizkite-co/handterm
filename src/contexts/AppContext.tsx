// src/contexts/AppContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { ActivityType, ParsedCommand } from '../types/Types';
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [outputElements, setOutputElements] = useState<React.ReactNode[]>([]);

  const { currentActivity } = useActivityMediatorContext();
  const { handleCommandExecuted } = useActivityMediator({
    currentActivity,
    startGame: function (): void {
      throw new Error('Function not implemented.');
    }
  })

  const appendToOutput = useCallback((element: React.ReactNode) => {
    if (Array.isArray(element)) {
      setOutputElements(prev => [...prev, ...element]);
    } else {
      setOutputElements(prev => [...prev, element]);
    }
    // Call handleCommandExecuted if the element is a command output
    if (React.isValidElement(element) && element.props['data-status'] !== undefined) {
      const commandString = element.props.children[0].props.children[3]; // Assuming the command is the fourth child of the first child
      const parsedCommand:ParsedCommand = parseCommand(commandString)
      handleCommandExecuted(parsedCommand);
    }
  }, [handleCommandExecuted]);

  const value = {
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
