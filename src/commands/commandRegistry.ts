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

    /**
     * Returns standardized styled HTML help for a single command, including its
     * switches (if any). Matches the cyan/aligned format used by `help`.
     */
    formatCommandHelp(cmd: ICommand): string {
        const switchEntries = cmd.switches
            ? Object.entries(cmd.switches).map(([key, desc]) => ({ name: `-${key}`, description: desc }))
            : [];
        const subcommandEntries = cmd.subcommands
            ? Object.entries(cmd.subcommands).map(([key, desc]) => ({ name: `${cmd.name} ${key}`, description: desc }))
            : [];
        const allEntries = [
            { name: cmd.name, description: cmd.description },
            ...switchEntries,
            ...subcommandEntries,
        ];
        const maxLen = Math.max(...allEntries.map(e => e.name.length));
        const lines = allEntries
            .map(e => `<span class="cmd-name">${e.name.padEnd(maxLen)}</span>  <span class="cmd-desc">${e.description}</span>`)
            .join('\n');
        return `<div class="command-list">${lines}</div>`;
    }

}

export const commandRegistry = new CommandRegistry();
