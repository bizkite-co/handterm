// src/commands/index.ts
import { type ICommand } from '../contexts/CommandContext';
import { createLogger } from 'src/utils/Logger'; // Import logger
import { commandRegistry } from './commandRegistry';

const logger = createLogger({ prefix: 'cmdRegistry' }); // Create logger instance

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

logger.debug('Starting command registration...'); // Log start

// Dynamically import and register all command files
const commandModules = import.meta.glob('./*Command.ts*', { eager: true });
logger.debug(`Found ${Object.keys(commandModules).length} potential command modules.`); // Log count

Object.entries(commandModules).forEach(([path, module]) => {
  const commandModule = module as CommandModule;
  logger.debug(`Processing module: ${path}`); // Log module path

  // Check for default export first
  if (commandModule.default && isValidCommand(commandModule.default)) {
    logger.debug(`Registering default export command: ${commandModule.default.name} from ${path}`); // Log registration
    commandRegistry.register(commandModule.default);
    return; // Assuming one command per file via default export
  }

  // If no default, check other exports (less common pattern here)
  const commands = Object.values(commandModule).filter(isValidCommand);
  if (commands.length > 0) {
      commands.forEach(command => {
        logger.debug(`Registering named export command: ${command.name} from ${path}`); // Log registration
        commandRegistry.register(command);
      });
  } else if (!commandModule.default) {
      logger.warn(`No valid command exports found in ${path}`); // Log if no commands found
  }
});

logger.debug('Command registration complete.'); // Log end
// Signal Playwright tests that commands are ready
(window as any).commandsRegistered = true;
