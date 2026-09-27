// src/commands/commandRegistry.ts

import { type ICommand } from '../contexts/CommandContext';

export type ICommandRegistryItems = Record<string, ICommand>;

type HelpEntry = { name: string; description: string };

function helpEntriesFor(cmd: ICommand): HelpEntry[] {
    const entries: HelpEntry[] = [
        { name: cmd.name, description: cmd.description },
    ];
    if (cmd.switches) {
        for (const [key, desc] of Object.entries(cmd.switches)) {
            entries.push({ name: `${cmd.name} -${key}`, description: desc });
        }
    }
    if (cmd.subcommands) {
        for (const [key, desc] of Object.entries(cmd.subcommands)) {
            entries.push({ name: `${cmd.name} ${key}`, description: desc });
        }
    }
    return entries;
}

function formatHelpEntries(entries: HelpEntry[]): string {
    if (entries.length === 0) {
        return '';
    }
    const maxLen = Math.max(...entries.map(e => e.name.length));
    return entries
        .map(e => `<span class="cmd-name">${e.name.padEnd(maxLen)}</span>  <span class="cmd-desc">${e.description}</span>`)
        .join('\n');
}

export class CommandRegistry {
    private commands: ICommandRegistryItems = {};

    register(command: ICommand) {
        this.commands[command.name] = command;
    }

    getCommand(name: string): ICommand | undefined {
        return this.commands[name];
    }

    /** Live snapshot of registered commands, sorted by name. */
    listCommands(): ICommand[] {
        return Object.values(this.commands)
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * Help text for every currently registered command (and each command's
     * switches/subcommands). Built from the live registry so a newly
     * registered command appears with no extra wiring.
     */
    getHelp(filter?: string): string {
        const commands = this.listCommands()
            .filter(cmd => !filter || cmd.name.includes(filter));
        return formatHelpEntries(commands.flatMap(helpEntriesFor));
    }

    /**
     * Returns standardized styled HTML help for a single command, including its
     * switches (if any). Matches the cyan/aligned format used by `help`.
     */
    formatCommandHelp(cmd: ICommand): string {
        return `<div class="command-list">${formatHelpEntries(helpEntriesFor(cmd))}</div>`;
    }

}

export const commandRegistry = new CommandRegistry();
