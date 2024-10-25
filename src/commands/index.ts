// src/commands/index.ts

// src/commands/index.ts
import { commandRegistry } from './commandRegistry';

// Dynamically import and register all command files
const commandModules = import.meta.glob('./*Command.ts', { eager: true });

Object.values(commandModules).forEach((module: any) => {
  const command = module.default || Object.values(module)[0];
  if (command && command.name && command.execute) {
    commandRegistry.register(command);
  }
});