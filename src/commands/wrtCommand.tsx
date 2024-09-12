import { ICommand } from './ICommand';
import React from 'react';
import { IHandTermProps } from '../components/HandTerm';

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
    args?: string[],
    switches?: Record<string, boolean | string>,
    handTerm?: React.RefObject<React.ComponentType<IHandTermProps>>
  ) => {
    if (!handTerm?.current) {
      return { status: 404, message: 'No command context available.' };
    }

    const handTermInstance = handTerm.current as any;

    if (switches && switches['file']) {
      // Logic to read and write file contents
      const fileName = typeof switches['file'] === 'string' ? switches['file'] : '';
      if (fileName) {
        // Read file contents and write to terminal
        handTermInstance.props.auth.getFile(fileName, 'txt')
          .then((response: any) => {
            if (response.status === 200 && response.data) {
              handTermInstance.writeOutput(response.data);
            } else {
              handTermInstance.writeOutput(`Error reading file: ${fileName}`);
            }
          })
          .catch((error: Error) => {
            handTermInstance.writeOutput(`Error reading file: ${error.message}`);
          });
      } else {
        handTermInstance.writeOutput('Please provide a file name.');
      }
    } else if (switches && switches['edit']) {
      // Logic to edit file contents
      const fileName = typeof switches['edit'] === 'string' ? switches['edit'] : '';
      if (fileName) {
        handTermInstance.setState({
          editMode: true,
          editFilePath: fileName,
          editFileExtension: 'txt',
        });
      } else {
        handTermInstance.writeOutput('Please provide a file name to edit.');
      }
    } else if (switches && switches['save']) {
      // Logic to save file contents
      const fileName = typeof switches['save'] === 'string' ? switches['save'] : '';
      if (fileName) {
        handTermInstance.props.auth.getFile(fileName, 'txt')
          .then((response: any) => {
            if (response.status === 200 && response.data) {
              handTermInstance.handleEditSave(response.data);
            } else {
              handTermInstance.writeOutput(`Error reading file: ${fileName}`);
            }
          })
          .catch((error: Error) => {
            handTermInstance.writeOutput(`Error reading file: ${error.message}`);
          });
      } else {
        handTermInstance.writeOutput('Please provide a file name to save.');
      }
    } else if (args && args.length > 0) {
      // Write the provided arguments to the terminal
      handTermInstance.writeOutput(args.join(' '));
    } else {
      return { status: 400, message: 'Please provide text to write or use a switch.' };
    }

    return { status: 200, message: 'Command executed successfully.' };
  }
};
