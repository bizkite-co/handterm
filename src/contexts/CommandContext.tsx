// src/contexts/CommandContext.tsx
import type React from 'react';
import { createContext, useContext } from 'react';

import { type IHandTermWrapperMethods } from '../components/HandTermWrapper';
import { type IAuthProps } from '../hooks/useAuth';
import { type OutputElement, type ParsedCommand, type ParsedLocation } from '../types/Types';

export interface ICommandResponse {
  status: number;
  message: string;
  body?: string | null;
  sensitive?: boolean; // Flag to indicate if the command response contains sensitive data
  type?: 'text' | 'webcontainer'; // Added type field
}

export interface ICommand {
  name: string;
  description: string;
  switches?: Record<string, string>;
  execute: (
    context: ICommandContext,
    parsedCommand: ParsedCommand,
  ) => Promise<ICommandResponse>;
}

export interface ICommandContext {
  executeCommand: (command: string) => Promise<void>;
  commandHistory: string[];
  addToCommandHistory: (command: string) => void;
  output: OutputElement[];
  appendToOutput: (output: OutputElement) => void;
  handTermRef: React.RefObject<IHandTermWrapperMethods>;
  auth: IAuthProps;
  updateLocation: (options: ParsedLocation) => void;
  webcontainerInstance: any;
}

export const CommandContext = createContext<ICommandContext | null>(null);

export const useCommandContext = (): ICommandContext => {
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error('useCommandContext must be used within a CommandProvider');
  }
  return context;
};
