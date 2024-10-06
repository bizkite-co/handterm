// src/commands/clearCommand.ts
import { LogKeys } from '../types/TerminalTypes';
import { IHandTermWrapperMethods } from "../components/HandTermWrapper";
import { ICommand } from '../contexts/CommandContext';

export const clearCommand: ICommand = {
  name: 'clear',
  description: 'Clear the command history',
  // Make sure the parameters match the ICommand execute definition
  execute: (
    _commandName: string,
    args?: string[],
    _switches?: Record<string, boolean | string>,
    handTerm?: React.RefObject<IHandTermWrapperMethods>
  ) => {
    if (!handTerm?.current) {
      return { status: 404, message: 'No command context available.' };
    }
    // Logic to clear the command history from localStorage
    // Logic to clear the command history from context (state)
    let removeKeys: string[] = [];
    for (let i = localStorage.length; i >= 0; i--) {
      let key = localStorage.key(i);
      if (!key) continue;
      if (
        key.includes(LogKeys.Command)
        || key.includes('terminalCommandHistory') // Remove after clearing legacy phone db.
        || key.includes(LogKeys.CharTime)
      ) {
        removeKeys.push(key);
      }
      if (args) {
        if (key.includes(args[0])) {
          removeKeys.push(key);
        }
      }
    }
    for (let removeKey of removeKeys) {
      localStorage.removeItem(removeKey); // Clear localStorage.length
    }
    const handTermInstance = handTerm.current as any;
    if (handTermInstance) {
      handTermInstance.setState({ commandHistory: [] });
      handTermInstance.setState({ outputElements: [] });
      handTermInstance.terminalReset();
      handTermInstance.prompt();
    }
    return { status: 200, message: 'Command history cleared.' };
  }
};
