// CommandContext.tsx
import React from 'react';
import { ICommandResponse } from './ICommand';

export interface ICommandContext {
  commandHistory: string[];
  appendToOutput: (element: React.ReactNode) => void;
  executeCommand: (
    commandName: string, 
    args?: string[], 
    switches?: Record<string, boolean | string>,
  ) => ICommandResponse;
}

// Create the context with a default value
export const CommandContext = React.createContext<ICommandContext | null>(null);