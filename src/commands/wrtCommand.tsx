import { ICommand, ICommandResponse } from './ICommand';
import { ICommandContext } from '../contexts/CommandContext';
import { ActivityType } from '../types/Types';

export const wrtCommand: ICommand = {
  name: 'wrt',
  description: 'Write to the terminal',
  switches: {
    'file': 'Write the contents of a file to the terminal',
    'edit': 'Edit the contents of a file',
    'save': 'Save the contents of a file',
  },
  execute: (
    _commandName: string,
    context: ICommandContext,
    args?: string[],
    switches?: Record<string, boolean | string>,
  ): ICommandResponse => {
    if (switches && switches['file']) {
      // Logic to read and write file contents
      const fileName = typeof switches['file'] === 'string' ? switches['file'] : '';
      if (fileName) {
        // Read file contents and write to terminal
        context.auth.getFile(fileName, 'txt')
          .then((response: any) => {
            if (response.status === 200 && response.data) {
              context.appendToOutput(response.data);
            } else {
              context.appendToOutput(<div>`Error reading file: ${fileName}`</div>);
            }
          })
          .catch((error: Error) => {
            context.appendToOutput(<div>`Error reading file: ${error.message}`</div>);
          });
      } else {
        context.appendToOutput('Please provide a file name.');
      }
    } else if (switches && switches['edit']) {
      // Logic to edit file contents
      const fileName = typeof switches['edit'] === 'string' ? switches['edit'] : '';
      if (fileName) {
        context.setEditMode(true);
        context.activityMediator.determineActivityState(ActivityType.EDIT);
      } else {
        context.appendToOutput('Please provide a file name to edit.');
      }
    } else if (switches && switches['save']) {
      // Logic to save file contents
      const fileName = typeof switches['save'] === 'string' ? switches['save'] : '';
      if (fileName) {
        context.auth.getFile(fileName, 'txt')
          .then((response: any) => {
            if (response.status === 200 && response.data) {
              context.handleEditSave(response.data);
            } else {
              context.appendToOutput(<div>`Error reading file: ${fileName}`</div>);
            }
          })
          .catch((error: Error) => {
            context.appendToOutput(`Error reading file: ${error.message}`);
          });
      } else {
        context.appendToOutput('Please provide a file name to save.');
      }
    } else if (args && args.length > 0) {
      // Write the provided arguments to the terminal
      context.appendToOutput(args.join(' '));
    } else {
      return { status: 400, message: 'Please provide text to write or use a switch.' };
    }

    return { status: 200, message: 'Command executed successfully.' };
  }
};
