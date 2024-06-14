// CommandContext.tsx
import React from 'react';

export interface ICommandContext {
  commandHistory: string[];
  appendToOutput: (element: React.ReactNode) => void;
  clearOuput: () => void;
  executeCommand: (
    commandName: string, 
    args?: string[], 
    switches?: Record<string, boolean | string>,
  ) => string;
}

// Create the context with a default value
export const CommandContext = React.createContext<ICommandContext | null>(null);