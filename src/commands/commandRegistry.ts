// src/commands/commandRegistry.ts

import { ICommand } from './ICommand';

class CommandRegistry {
    private commands: Record<string, ICommand> = {};

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