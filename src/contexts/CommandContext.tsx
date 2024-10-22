// src/contexts/CommandContext.tsx
import React, { createContext, ReactDOM, useContext } from 'react';
import { IAuthProps } from '../lib/useAuth';
import { IHandTermWrapperMethods } from '../components/HandTermWrapper';
import { ActivityType, OutputElement, ParsedCommand } from '../types/Types';
import { useReactiveLocation } from 'src/hooks/useReactiveLocation';

export interface ICommandResponse {
  status: number;
  message: string;
  body?: string | null;
}

export interface ICommand {
  name: string;
  description: string;
  switches?: Record<string, string>;
  execute: (
    context: ICommandContext,
    parsedCommand: ParsedCommand,
  ) => ICommandResponse;
}

export interface ICommandContext {
  executeCommand: (command: string) => Promise<void>;
  commandHistory: string[];
  addToCommandHistory: (command: string) => void;
  output: OutputElement[];
  appendToOutput: (output: OutputElement) => void;
  handTermRef: React.RefObject<IHandTermWrapperMethods>;
  auth: IAuthProps;  
  updateLocation: (options: {
    activity?: ActivityType | null;
    phraseKey?: string | null;
    groupKey?: string | null;
  }) => void;
}

export const CommandContext = createContext<ICommandContext | null>(null);

export const useCommandContext = () => {
  
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error('useCommandContext must be used within a CommandProvider');
  }
  return context;
};
