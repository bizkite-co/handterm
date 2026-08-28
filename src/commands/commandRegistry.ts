// src/commands/commandRegistry.ts

import { type ICommand } from '../contexts/CommandContext';

export type ICommandRegistryItems = Record<string, ICommand>;

class CommandRegistry {
    private commands: ICommandRegistryItems = {};

    register(command: ICommand) {
        this.commands[command.name] = command;
    }

    getCommand(name: string): ICommand | undefined {
        return this.commands[name];
    }

    getHelp(filter?: string): string {
        const commands = Object.values(this.commands)
            .filter(cmd => !filter || cmd.name.includes(filter));
        const maxNameLen = Math.max(...commands.map(cmd => cmd.name.length));
        return commands
            .map(cmd => `<span class="cmd-name">${cmd.name.padEnd(maxNameLen)}</span>  <span class="cmd-desc">${cmd.description}</span>`)
            .join('\n');
    }

}

export const commandRegistry = new CommandRegistry();
