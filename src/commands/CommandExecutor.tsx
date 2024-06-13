// src/components/CommandExecutor.tsx
import React, { useContext } from 'react';
import { CommandContext } from './CommandContext';
import { commandRegistry } from './commandRegistry';

export const CommandExecutor: React.FC = () => {
  const context = useContext(CommandContext);

  const executeCommand = (commandName: string, args: string[]) => {
    if (!context) {
      // Handle the case where the context is null
      return 'No command context available.';
    }

    const commandHook = commandRegistry.getCommandHook(commandName);
    if (commandHook) {
      // Execute the command using the hook and pass in the non-null context
      const output = commandHook(context)(args);
      // Do something with the output, like updating state or rendering
      return output;
    } else {
      return `Command not found: ${commandName}`;
    }
  };

  // ... rest of your component
  return null;
};