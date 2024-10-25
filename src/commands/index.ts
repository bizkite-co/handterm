// src/commands/index.ts

import { commandRegistry } from './commandRegistry';
import { clearCommand } from './clearCommand';
import { ListPhrasesCommand } from "./ListPhrasesCommand";
import { archiveCommand } from './archiveCommand';
import { wrtCommand } from './wrtCommand';
import { cleanCommand } from './cleanCommand';
import HelpCommand from './HelpCommand';
import EditCommand from './editCommand';
import { LoginCommand } from './LoginCommand';
import { BypassCommand } from './BypassCommand';
import { SignUpCommand } from './SignUpCommand';

commandRegistry.register(clearCommand);
commandRegistry.register(cleanCommand);
commandRegistry.register(ListPhrasesCommand);
commandRegistry.register(archiveCommand);
commandRegistry.register(wrtCommand);
commandRegistry.register(HelpCommand);
commandRegistry.register(EditCommand);
commandRegistry.register(LoginCommand);
commandRegistry.register(BypassCommand);
commandRegistry.register(SignUpCommand);