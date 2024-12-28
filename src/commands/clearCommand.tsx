// src/commands/clearCommand.tsx
import type React from 'react';

import { type IHandTermWrapperMethods } from "../components/HandTermWrapper";
import { type ICommand, type ICommandContext, type ICommandResponse } from '../contexts/CommandContext';
import { LogKeys } from '../types/TerminalTypes';
import { type ParsedCommand, type OutputElement } from '../types/Types';

interface HandTermState {
  commandHistory?: unknown[];
  outputElements?: unknown[];
}

interface HandTermInstance extends IHandTermWrapperMethods {
  setState: (state: Partial<HandTermState>) => void;
  terminalReset: () => void;
  prompt: () => void;
}

// Extend ICommandContext to include handTerm
interface ExtendedCommandContext extends ICommandContext {
  handTerm?: React.RefObject<HandTermInstance>;
  appendToOutput: (output: OutputElement) => void;
}

export const clearCommand: ICommand = {
  name: 'clear',
  description: 'Clear the command history',
  execute: async (
    context: ExtendedCommandContext,
    parsedCommand: ParsedCommand
  ): Promise<ICommandResponse> => {
    const handTerm = context.handTerm;

    if (!handTerm?.current) {
      const outputElement: OutputElement = {
        command: parsedCommand,
        response: 'No command context available.',
        status: 404,
        commandTime: new Date()
      };
      context.appendToOutput(outputElement);
      return { status: 404, message: 'No command context available.' };
    }

    // Logic to clear the command history from localStorage
    const removeKeys: string[] = [];
    for (let i = localStorage.length; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (
        key.includes(LogKeys.Command)
        || key.includes('terminalCommandHistory') // Remove after clearing legacy phone db.
        || key.includes(LogKeys.CharTime)
      ) {
        removeKeys.push(key);
      }

      if (parsedCommand.args.length > 0) {
        if (key.includes(parsedCommand.args[0])) {
          removeKeys.push(key);
        }
      }
    }

    for (const removeKey of removeKeys) {
      localStorage.removeItem(removeKey); // Clear localStorage.length
    }

    const handTermInstance = handTerm.current;
    if (handTermInstance) {
      handTermInstance.setState({ commandHistory: [] });
      handTermInstance.setState({ outputElements: [] });
      handTermInstance.terminalReset();
      handTermInstance.prompt();
    }

    const outputElement: OutputElement = {
      command: parsedCommand,
      response: 'Command history cleared.',
      status: 200,
      commandTime: new Date()
    };
    context.appendToOutput(outputElement);

    return { status: 200, message: 'Command history cleared.' };
  }
};
