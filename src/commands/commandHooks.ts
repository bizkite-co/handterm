// commandHooks.ts
import { useVideoCommand } from './useVideoCommand';
import { ICommandContext } from './CommandContext';
import { useClearCommand } from './clearCommand';

// Define a type that maps command hook names to their functions
export type CommandHooks = {
  [hookName: string]: (context: ICommandContext) => (args: string[]) => string;
};

// Map the hook names to their functions
export const commandHooks: CommandHooks = {
  useVideoCommand,
  useClearCommand
  // ...other command hooks
};