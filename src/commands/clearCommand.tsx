// src/commands/clearCommand.ts
import HandTerm from '../components/HandTerm';
import { ICommand } from './ICommand';

export const clearCommand: ICommand = {
  name: 'clear',
  description: 'Clear the command history',
  // Make sure the parameters match the ICommand execute definition
  execute: (
    _commandName: string, 
    _args?: string[], 
    _switches?: Record<string, boolean | string>, 
    _handTerm?: HandTerm
  ) => {
    if (!_handTerm) {
      return { status: 404, message: 'No command context available.'};
    }
    // Logic to clear the command history from localStorage
    // Logic to clear the command history from context (state)
    _handTerm.clearCommandHistory();
    return { status: 200, message: 'Command history cleared.'};
  }
};