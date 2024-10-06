// src/commands/CommandContext.tsx
import React from 'react';
import { IAuthProps } from 'src/lib/useAuth';
import { IActivityMediatorReturn } from 'src/hooks/useActivityMediator';

export interface ICommandResponse {
  status: number;
  message: string;
}

export interface ICommand {
  name: string;
  description: string;
  switches?: Record<string, string>;
  execute: (
    commandName: string,
    context: ICommandContext,
    args?: string[],
    switches?: Record<string, boolean | string>,
  ) => ICommandResponse;
}
export interface ICommandContext {
  commandHistory: string[];
  appendToOutput: (element: React.ReactNode) => void;
  setEditMode: (isEditMode: boolean) => void;
  handleEditSave: (content: string) => void;
  auth: IAuthProps;
  activityMediator: IActivityMediatorReturn;
  // Add any other methods that commands might need
}

// Create the context with a default value
export const CommandContext = React.createContext<ICommandContext | null>(null);