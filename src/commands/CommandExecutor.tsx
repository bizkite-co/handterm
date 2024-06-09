// CommandExecutor.tsx
import React, { useContext } from 'react';
import { commandRegistry } from './commandRegistry';
import { commandHooks, CommandHooks } from './commandHooks'; // Import the CommandHooks type
import { CommandContext, ICommandContext } from './CommandContext';

export const CommandExecutor = () => {
  const context = useContext(CommandContext);

  const handleCommand = (input: string): string => {
    const [commandName, ...args] = input.split(/\s+/);
    const commandDefinition = commandRegistry.getCommand(commandName);

    if (commandDefinition && context) {
      // Retrieve the hook using the hook name from the command registry
      const commandHook = commandHooks[commandDefinition.hook];
      if (commandHook) {
        const executeCommand = commandHook(context);
        const output = executeCommand(args);
        // Do something with the output, like updating state or rendering
        return output;
      }
      return `Command hook not found: ${commandName}`;
    } else {
      // Handle command not found
      return `Command not found: ${commandName}`;
    }
  };

  // ... return JSX for your component
};