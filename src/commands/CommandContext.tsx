// CommandContext.tsx
import React from 'react';

export interface ICommandContext {
  commandHistory: string[];
  setCommandHistory: React.Dispatch<React.SetStateAction<string[]>>;
  executeCommand: (commandName: string, args?: string[], switches?: Record<string, boolean | string>) => string;
}

// Create the context with a default value
export const CommandContext = React.createContext<ICommandContext | null>(null);