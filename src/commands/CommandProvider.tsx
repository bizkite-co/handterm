// src/commands/CommandProvider.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { CommandContext, ICommandContext } from './CommandContext';
import { commandRegistry } from './commandRegistry';
import { IHandTermMethods } from '../components/HandTerm';

interface CommandProviderProps {
  children?: React.ReactNode;
  handTermRef: React.RefObject<IHandTermMethods>;
}

export const CommandProvider: React.FC<CommandProviderProps> = ({ children, handTermRef }) => {

  const [commandHistory] = useState<string[]>([]);

  const executeCommand = useCallback((commandName: string, args?: string[], switches?: Record<string, boolean | string>) => {
    const handTerm = handTermRef.current;
    if (!handTerm) {
      console.error('CommandProvider: handTermRef.current is NULL');
      return {status: 404, message: 'CommandProvider: handTermRef.current is NULL'};
    }
    const command = commandRegistry.getCommand(commandName);
    if (command) {
      // Execute the command and return the result
      return {status: 200, message: command.execute(commandName, args, switches, { current: handTerm }).message };
    }
    return { status: 404, message: `CommandProvider: Command not found: ${commandName}`};
  }, [handTermRef]);

  const appendToOutput = useCallback((element: React.ReactNode) => {
    const handTerm = handTermRef.current;
    if (!handTerm) {
      console.error('CommandProvider: handTermRef.current is NULL');
      return 'CommandProvider: handTermRef.current is NULL';
    }
    if(element && handTerm) handTerm.writeOutput(element.toString());
  }, [handTermRef]);


  // Provide the context with the necessary values
  const contextValue = useMemo<ICommandContext>(() => ({
    commandHistory,
    executeCommand,
    appendToOutput: appendToOutput,
  }), [executeCommand]);

  return (
    <CommandContext.Provider value={contextValue}>
      {children}
    </CommandContext.Provider>
  );
};
