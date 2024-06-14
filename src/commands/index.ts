// src/commands/index.ts

import { commandRegistry } from './commandRegistry';
import { clearCommand } from './clearCommand';
import { ListPhrasesCommand } from "./ListPhrasesCommand";

commandRegistry.register(clearCommand);
commandRegistry.register(ListPhrasesCommand);