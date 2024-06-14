// src/commands/clearCommand.ts
import { ICommandContext } from './CommandContext';
import { ICommand } from './ICommand';

export const clearCommand: ICommand = {
  name: 'clear',
  description: 'Clear the command history',
  // Make sure the parameters match the ICommand execute definition
  execute: (_commandName: string, _args?: string[], _switches?: Record<string, boolean | string>, context?: ICommandContext) => {
    if (!context) {
      return 'No command context available.';
    }
    // Logic to clear the command history from localStorage
    // Logic to clear the command history from context (state)
    context.setCommandHistory([]);
    return 'Command history cleared.';
  }
};