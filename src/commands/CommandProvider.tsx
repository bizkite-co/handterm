// src/commands/CommandProvider.tsx
import React, { useCallback, useMemo, useState, useRef } from 'react';
import { CommandContext, ICommandContext } from './CommandContext';
import { commandRegistry } from './commandRegistry';

interface CommandProviderProps {
  children?: React.ReactNode;
}

export const CommandProvider: React.FC<CommandProviderProps> = ({ children }) => {
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

const executeCommand = useCallback((commandName: string, args?: string[], switches?: Record<string, boolean | string>) => {
    const command = commandRegistry.getCommand(commandName);
    if (command) {
      // Execute the command and return the result
      return command.execute(commandName, args, switches);
    }
    return `CommandProvider: Command not found: ${commandName}`;
  }, []);

  // Provide the context with the necessary values
  const contextValue = useMemo<ICommandContext>(() => ({
    commandHistory,
    videoRef,
    setCommandHistory: setCommandHistory,
    executeCommand
  }), [commandHistory, executeCommand]);

  return (
    <CommandContext.Provider value={contextValue}>
      {children}
    </CommandContext.Provider>
  );
};