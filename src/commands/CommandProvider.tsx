// src/commands/CommandProvider.tsx
import React, { useCallback, useMemo, useState, useRef } from 'react';
import { CommandContext, ICommandContext } from './CommandContext';
import { commandRegistry } from './commandRegistry';
import HandTerm from '../components/HandTerm';

interface CommandProviderProps {
  children?: React.ReactNode;
  handTermRef: React.RefObject<HandTerm>;
}

export const CommandProvider: React.FC<{ children?: React.ReactNode, handTermRef: React.RefObject<HandTerm> }> = ({ children, handTermRef }) => {

  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const executeCommand = useCallback((commandName: string, args?: string[], switches?: Record<string, boolean | string>) => {
    const handTerm = handTermRef.current;
    if (!handTerm) {
      console.error('CommandProvider: handTermRef.current is NULL');
      return 'CommandProvider: handTermRef.current is NULL';
    }
    const command = commandRegistry.getCommand(commandName);
    if (command) {
      // Execute the command and return the result
      return command.execute(commandName, args, switches, handTerm);
    }
    return `CommandProvider: Command not found: ${commandName}`;
  }, []);

  // Provide the context with the necessary values
  const contextValue = useMemo<ICommandContext>(() => ({
    commandHistory,
    setCommandHistory: setCommandHistory,
    executeCommand
  }), [commandHistory, executeCommand]);

  return (
    <CommandContext.Provider value={contextValue}>
      {children}
    </CommandContext.Provider>
  );
};