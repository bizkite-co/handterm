// src/commands/CommandProvider.tsx
import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { CommandContext, ICommandContext } from '../contexts/CommandContext';
import { commandRegistry } from './commandRegistry';
import { IHandTermWrapperMethods } from '../components/HandTermWrapper';
import { IAuthProps } from '../lib/useAuth';
import { useActivityMediatorContext } from '../contexts/ActivityMediatorContext';

interface CommandProviderProps {
  children: React.ReactNode;
  handTermRef: React.RefObject<IHandTermWrapperMethods>;
  auth: IAuthProps;
}

export const CommandProvider: React.FC<CommandProviderProps> = ({ children,
  handTermRef, auth }) => {
    const contextRef = useRef<ICommandContext | null>(null);
    const activityMediator = useActivityMediatorContext();

  const executeCommand = useCallback((commandName: string, args?: string[],
    switches?: Record<string, boolean | string>) => {
    const handTerm = handTermRef.current;
    if (!handTerm || !contextRef.current) {
      console.error('CommandProvider: handTermRef.current or context is NULL');
      return { status: 404, message: 'CommandProvider: handTermRef.current or context is NULL' };
    }
    const command = commandRegistry.getCommand(commandName);
    if (command) {
      return command.execute(commandName, contextRef.current, args, switches);
    }
    return { status: 404, message: `CommandProvider: Command not found: ${commandName}` };
  }, [handTermRef]);

  const appendToOutput = useCallback((element: React.ReactNode) => {
    const handTerm = handTermRef.current;
    if (!handTerm) {
      console.error('CommandProvider: handTermRef.current is NULL');
      return;
    }
    handTerm.writeOutput(element);
  }, [handTermRef]);

  const contextValue = useMemo<ICommandContext>(() => ({
    commandHistory: [],
    auth,
    activityMediator,
    executeCommand,
    appendToOutput,
    setEditMode: (isEditMode: boolean) => {
      const handTerm = handTermRef.current;
      if (handTerm && handTerm.setEditMode) {
        handTerm.setEditMode(isEditMode);
      }
    },
    handleEditSave: (content: string) => {
      const handTerm = handTermRef.current;
      if (handTerm && handTerm.handleEditSave) {
        handTerm.handleEditSave(content);
      }
    },
  }), [auth, activityMediator, executeCommand, appendToOutput, handTermRef]);

  useEffect(() => {
    contextRef.current = contextValue;
  }, [contextValue]);

  return (
    <CommandContext.Provider value={contextValue}>
      {children}
    </CommandContext.Provider>
  );
};