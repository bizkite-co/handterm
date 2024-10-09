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
    startGame: function (): void {
      throw new Error('Function not implemented.');
    }
  })

  const appendToOutput = useCallback((newElement: ReactElement<OutputElement>) => {
    if (Array.isArray(newElement)) {
      setOutputElements(prev => [...prev, ...newElement]);
    } else {
      setOutputElements((prev) => [...prev, newElement]);
    }
    // Call handleCommandExecuted if the element is a command output
    if (React.isValidElement(newElement) && newElement.props['data-status'] !== undefined) {
      const commandString = newElement.props.children[0].props.children[3]; // Assuming the command is the fourth child of the first child
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
