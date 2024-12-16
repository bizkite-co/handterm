import React from 'react';

import { ICommand, ICommandResponse, ICommandContext } from '../contexts/CommandContext';
import { IAuthProps } from '../hooks/useAuth';
import { ActivityType, OutputElement, ParsedCommand } from '../types/Types';

// Extend the command context with optional methods
interface ExtendedCommandContext extends ICommandContext {
  auth: IAuthProps & {
    getFile?: (fileName: string, format: string) => Promise<{
      status: number;
      data?: string;
      message?: string;
    }>;
  };
  setEditMode?: (mode: boolean) => void;
  activityMediator?: {
    determineActivityState?: (activity: ActivityType) => void;
  };
  handleEditSave?: (content: string) => void;
}

export const wrtCommand: ICommand = {
  name: 'wrt',
  description: 'Write to the terminal',
  switches: {
    'file': 'Write the contents of a file to the terminal',
    'edit': 'Edit the contents of a file',
    'save': 'Save the contents of a file',
  },
  execute: async (
    context: ExtendedCommandContext,
    parsedCommand: ParsedCommand
  ): Promise<ICommandResponse> => {
    const switches = parsedCommand.switches;
    const args = parsedCommand.args;

    const getFileName = (switchKey: string): string | null => {
      const fileName = switches[switchKey];
      return typeof fileName === 'string' ? fileName : null;
    };

    const createOutputElement = (message: string | React.ReactNode): OutputElement => ({
      command: parsedCommand,
      response: message,
      status: 200,
      commandTime: new Date()
    });

    try {
      if (switches['file']) {
        const fileName = getFileName('file');
        if (fileName && context.auth.getFile) {
          try {
            const response = await context.auth.getFile(fileName, 'txt');
            if (response.status === 200 && response.data) {
              context.appendToOutput(createOutputElement(response.data));
            } else {
              context.appendToOutput(createOutputElement(`Error reading file: ${fileName}`));
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            context.appendToOutput(createOutputElement(`Error reading file: ${errorMessage}`));
          }
        } else {
          context.appendToOutput(createOutputElement('Please provide a file name or file reading is not supported.'));
        }
      } else if (switches['edit']) {
        const fileName = getFileName('edit');
        if (fileName && context.setEditMode && context.activityMediator?.determineActivityState) {
          context.setEditMode(true);
          context.activityMediator.determineActivityState(ActivityType.EDIT);
        } else {
          context.appendToOutput(createOutputElement('Please provide a file name to edit or edit mode is not supported.'));
        }
      } else if (switches['save']) {
        const fileName = getFileName('save');
        if (fileName && context.auth.getFile && context.handleEditSave) {
          try {
            const response = await context.auth.getFile(fileName, 'txt');
            if (response.status === 200 && response.data) {
              context.handleEditSave(response.data);
            } else {
              context.appendToOutput(createOutputElement(`Error reading file: ${fileName}`));
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            context.appendToOutput(createOutputElement(`Error reading file: ${errorMessage}`));
          }
        } else {
          context.appendToOutput(createOutputElement('Please provide a file name to save or save functionality is not supported.'));
        }
      } else if (args.length > 0) {
        // Write the provided arguments to the terminal
        context.appendToOutput(createOutputElement(args.join(' ')));
      } else {
        return { status: 400, message: 'Please provide text to write or use a switch.' };
      }

      return { status: 200, message: 'Command executed successfully.' };
    } catch (error) {
      return {
        status: 500,
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    }
  }
};
