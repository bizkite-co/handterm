
// src/commands/CommandProvider.tsx
import React, { useCallback, useMemo } from 'react';
import { CommandContext } from './CommandContext';
import { commandRegistry } from './commandRegistry';

export const CommandProvider: React.FC = ({ children }) => {
  const executeCommand = useCallback((commandName: string, args: string[]) => {
    const command = commandRegistry.getCommand(commandName);
    if (command) {
      // Execute the command and return the result
      return command.execute(args);
    }
    return `Command not found: ${commandName}`;
  }, []);

  // Provide the context with the executeCommand function
  const contextValue = useMemo(() => ({
    executeCommand
  }), [executeCommand]);

  return (
    <CommandContext.Provider value={contextValue}>
      {children}
    </CommandContext.Provider>
  );
};