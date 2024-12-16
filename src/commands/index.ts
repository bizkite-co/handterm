// src/commands/index.ts
import { ICommand } from '../contexts/CommandContext';

import { commandRegistry } from './commandRegistry';

// Interface for command modules
interface CommandModule {
  default?: ICommand;
  [key: string]: ICommand | undefined;
}

// Type guard to check if a value is a valid command
function isValidCommand(command: unknown): command is ICommand {
  return (
    typeof command === 'object' &&
    command !== null &&
    'name' in command &&
    'execute' in command &&
    typeof (command as ICommand).name === 'string' &&
    typeof (command as ICommand).execute === 'function'
  );
}

// Dynamically import and register all command files
const commandModules = import.meta.glob('./*Command.ts*', { eager: true });

Object.entries(commandModules).forEach(([_path, module]) => {
  const commandModule = module as CommandModule;

  // Check for default export first
  if (commandModule.default && isValidCommand(commandModule.default)) {
    commandRegistry.register(commandModule.default);
    return;
  }

  // If no default, check other exports
  const commands = Object.values(commandModule).filter(isValidCommand);
  commands.forEach(command => {
    commandRegistry.register(command);
  });
});
