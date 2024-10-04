// src/commands/index.ts

import { commandRegistry } from './commandRegistry';
import { clearCommand } from './clearCommand';
import { ListPhrasesCommand } from "./ListPhrasesCommand";
import { archiveCommand } from './archiveCommand';
import { wrtCommand } from './wrtCommand';
import { cleanCommand } from './cleanCommand';
import HelpCommand from './HelpCommand';

commandRegistry.register(clearCommand);
commandRegistry.register(cleanCommand);
commandRegistry.register(ListPhrasesCommand);
commandRegistry.register(archiveCommand);
commandRegistry.register(wrtCommand);
commandRegistry.register(HelpCommand);