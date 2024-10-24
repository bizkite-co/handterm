// src/commands/commandRegistry.ts

import { ICommand } from '../contexts/CommandContext';
import { clearCommand } from './clearCommand';
import { ListPhrasesCommand } from './ListPhrasesCommand';
import { wrtCommand } from './wrtCommand';
import EditCommand from './editCommand'
import { LoginCommand } from './LoginCommand';

export type ICommandRegistryItems = Record<string, ICommand>;



class CommandRegistry {
    private commands: ICommandRegistryItems = {
        'clear': clearCommand,
        'ls': ListPhrasesCommand,
        'wrt': wrtCommand,
        'edit': EditCommand,
        'login': LoginCommand, 
    };

    register(command: ICommand) {
        this.commands[command.name] = command;
    }

    getCommand(name: string): ICommand | undefined {
        return this.commands[name];
    }

    getHelp(filter?: string): string {
        return Object.values(this.commands)
            .filter(cmd => !filter || cmd.name.includes(filter))
            .map(cmd => `${cmd.name}: ${cmd.description}`)
            .join('\n\n');
    }

}

export const commandRegistry = new CommandRegistry();
