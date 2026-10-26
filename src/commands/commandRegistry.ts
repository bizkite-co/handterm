// src/commands/commandRegistry.ts

import { type ICommand } from '../contexts/CommandContext';

export type ICommandRegistryItems = Record<string, ICommand>;

type HelpEntry = { name: string; description: string };

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function commandHelpName(cmd: ICommand): string {
    if (cmd.aliases !== undefined && cmd.aliases.length > 0) {
        return [cmd.name, ...cmd.aliases].join(', ');
    }
    return cmd.name;
}

function primaryHelpEntryFor(cmd: ICommand): HelpEntry {
    return { name: commandHelpName(cmd), description: cmd.description };
}

function helpEntriesFor(cmd: ICommand): HelpEntry[] {
    const entries: HelpEntry[] = [
        primaryHelpEntryFor(cmd),
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
        .map(e => `<span class="cmd-name">${escapeHtml(e.name.padEnd(maxLen))}</span>  <span class="cmd-desc">${escapeHtml(e.description)}</span>`)
        .join('\n');
}

export class CommandRegistry {
    private commands: ICommandRegistryItems = {};

    register(command: ICommand) {
        this.commands[command.name] = command;
        for (const alias of command.aliases ?? []) {
            this.commands[alias] = command;
        }
    }

    getCommand(name: string): ICommand | undefined {
        return this.commands[name];
    }

    /** Live snapshot of registered commands, sorted by name. */
    listCommands(): ICommand[] {
        const seen = new Set<string>();
        return Object.values(this.commands)
            .filter(cmd => {
                if (seen.has(cmd.name)) {
                    return false;
                }
                seen.add(cmd.name);
                return true;
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * Help text for commands.
     * - When called without a filter, lists only primary registered commands
     *   (names/aliases and description) so the output is concise and readable.
     * - When called with a filter matching a specific command (or alias), returns
     *   detailed help for that command including its switches and subcommands.
     * - When called with a filter matching multiple commands, lists the matching
     *   primary commands.
     */
    getHelp(filter?: string): string {
        const trimmedFilter = filter?.trim();
        if (!trimmedFilter) {
            return formatHelpEntries(this.listCommands().map(primaryHelpEntryFor));
        }

        const directMatch = this.getCommand(trimmedFilter);
        if (directMatch) {
            return formatHelpEntries(helpEntriesFor(directMatch));
        }

        const lowerFilter = trimmedFilter.toLowerCase();
        const matching = this.listCommands().filter(cmd =>
            cmd.name.toLowerCase().includes(lowerFilter) ||
            cmd.aliases?.some(a => a.toLowerCase().includes(lowerFilter))
        );

        if (matching.length === 1) {
            return formatHelpEntries(helpEntriesFor(matching[0]));
        }

        if (matching.length > 1) {
            return formatHelpEntries(matching.map(primaryHelpEntryFor));
        }

        return '';
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
