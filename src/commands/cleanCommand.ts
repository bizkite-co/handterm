
// src/commands/cleanCommand.ts
import { LogKeys } from '../types/TerminalTypes';
import { ICommand, ICommandContext } from '../contexts/CommandContext';
import { saveCommandHistory } from '../utils/commandUtils';

export const cleanCommand: ICommand = {
    name: 'clean',
    description: 'clean the command history',
    // Make sure the parameters match the ICommand execute definition
    execute: (
        _commandName: string,
        context: ICommandContext,
        _args?: string[],
        _switches?: Record<string, boolean | string>,
    ) => {
        if (!context) {
            return { status: 404, message: 'No command context available.' };
        }
        // Logic to clean the command history from localStorage
        const commandHistory = JSON.parse(localStorage.getItem(LogKeys.CommandHistory) || '[]')
            .filter((ch: string) => { return ch !== 'Return (ENTER)'; })
        let prevCommand = ''
        for (let i = commandHistory.length - 1; i >= 0; i--) {
            if (commandHistory[i] === prevCommand) {
                // handTerm.writeOutput(prevCommand + '\n');
                commandHistory.splice(i, 1);
            } else {
                prevCommand = commandHistory[i];
            }
        }

        saveCommandHistory(commandHistory);
        localStorage.setItem(LogKeys.CommandHistory, JSON.stringify(commandHistory));
        handTerm?.current?.terminalReset();
        handTerm?.current?.prompt();
        return { status: 200, message: 'Command history cleaned.' };
    }
};
