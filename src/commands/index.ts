// src/commands/index.ts

import { commandRegistry } from './commandRegistry';
import { clearCommand } from './clearCommand';
import { ListPhrasesCommand } from "./ListPhrasesCommand";
import { archiveCommand } from './archiveCommand';
import { wrtCommand } from './wrtCommand';

commandRegistry.register(clearCommand);
commandRegistry.register(ListPhrasesCommand);
commandRegistry.register(archiveCommand);
commandRegistry.register(wrtCommand);