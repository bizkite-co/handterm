// src/commands/clearCommand.tsx
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
    const removeKeys = Object.keys(localStorage).filter(key => {
      const matchesDefaultKeys = key.includes(LogKeys.Command ?? '') ||
        key.includes('terminalCommandHistory') ||
        key.includes(LogKeys.CharTime ?? '');

      const matchesArg = parsedCommand.args.length > 0 &&
        key.includes(parsedCommand.args[0] ?? '');

      return matchesDefaultKeys ?? matchesArg;
    });

    await Promise.all(removeKeys.map(async (removeKey) => {
      await new Promise<void>((resolve) => {
        localStorage.removeItem(removeKey); // Clear localStorage.length
        resolve();
      });
    }));

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
