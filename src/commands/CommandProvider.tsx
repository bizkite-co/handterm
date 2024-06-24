// src/commands/CommandProvider.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { CommandContext, ICommandContext } from './CommandContext';
import { commandRegistry } from './commandRegistry';
import HandTerm from '../components/HandTerm';

interface CommandProviderProps {
  children?: React.ReactNode;
  handTermRef: React.RefObject<HandTerm>;
}

export const CommandProvider: React.FC<CommandProviderProps> = (props: CommandProviderProps) => {

  const [commandHistory ] = useState<string[]>([]);
  

  const executeCommand = useCallback((commandName: string, args?: string[], switches?: Record<string, boolean | string>) => {
    const handTerm = props.handTermRef.current;
    if (!handTerm) {
      console.error('CommandProvider: handTermRef.current is NULL');
      return {status: 404, message: 'CommandProvider: handTermRef.current is NULL'};
    }
    const command = commandRegistry.getCommand(commandName);
    if (command) {
      // Execute the command and return the result
      return {status: 200, message: command.execute(commandName, args, switches, handTerm).message };
    }
    return { status: 404, message: `CommandProvider: Command not found: ${commandName}`};
  }, []);

  const appendToOutput = useCallback((element: React.ReactNode) => {
    const handTerm = props.handTermRef.current;
    if (!handTerm) {
      console.error('CommandProvider: handTermRef.current is NULL');
      return 'CommandProvider: handTermRef.current is NULL';
    }
    if(element) handTerm.writeOutput(element.toString());
  }, []);

  const clearOuput = useCallback(() => {
    const handTerm = props.handTermRef.current;
    if (!handTerm) {
      console.error('CommandProvider: handTermRef.current is NULL');
      return 'CommandProvider: handTermRef.current is NULL';
    }
    handTerm.clearCommandHistory("clear");
  }, []);

  // Provide the context with the necessary values
  const contextValue = useMemo<ICommandContext>(() => ({
    commandHistory,
    executeCommand,
    appendToOutput: appendToOutput,
    clearOuput: clearOuput
  }), [commandHistory, executeCommand]);

  return (
    <CommandContext.Provider value={contextValue}>
      {props.children}
    </CommandContext.Provider>
  );
};