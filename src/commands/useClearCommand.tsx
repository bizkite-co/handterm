// src/commands/useClearCommand.ts
import { useCallback } from 'react';
import { ICommandContext } from './CommandContext';

export const useClearCommand = (context: ICommandContext) => {
  // This hook uses the context to clear the command history
  const clearCommandHistory = useCallback(() => {
    // Logic to clear the command history from localStorage
    // Logic to clear the command history from context (state)
    context.setCommandHistory([]);

    return 'Command history cleared.';
  }, [context]);

  return clearCommandHistory;
};