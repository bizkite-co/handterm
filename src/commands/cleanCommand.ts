// src/commands/cleanCommand.ts

import { safelyCallMethodOnRef } from '../utils/typeSafetyUtils';
import { type ICommand, type ICommandContext, type ICommandResponse } from '../contexts/CommandContext';
import { StorageKeys } from '../types/TerminalTypes';
import { saveCommandHistory } from '../utils/commandUtils';

function isString(value: unknown): value is string {
    return typeof value === 'string';
}

export const cleanCommand: ICommand = {
    name: 'clean',
    description: 'clean the command history',
    // Make sure the parameters match the ICommand execute definition
    execute: async (
        context: ICommandContext,
    ): Promise<ICommandResponse> => {
        if (context == null) {
            return { status: 404, message: 'No command context available.' };
        }
        // Explicitly handle undefined case for localStorage.getItem()
        const storedValue = localStorage.getItem(StorageKeys.commandHistory ?? '');
        let commandHistory: string[] = [];
        if (isString(storedValue)) {
            commandHistory = JSON.parse(storedValue ?? '[]') as string[];
        }

        let prevCommand: string = '';
        for (let i: number = commandHistory.length - 1; i >= 0; i--) {
            if (commandHistory[i] === prevCommand) {
                commandHistory.splice(i, 1);
            } else {
                prevCommand = commandHistory[i] ?? '';
            }
        }

        saveCommandHistory(commandHistory);
        safelyCallMethodOnRef(context.handTermRef, 'prompt');

        // Add a placeholder await to satisfy the async requirement
        await Promise.resolve();
        return { status: 200, message: 'Command history cleaned.' };
    },
};
