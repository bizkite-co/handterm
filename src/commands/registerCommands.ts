// src/commands/registerCommands.ts
import { commandRegistry } from './commandRegistry';
import { clearCommand } from './clearCommand';
// ... import other commands

// Register all your commands
commandRegistry.register(clearCommand);
// ... register other commands