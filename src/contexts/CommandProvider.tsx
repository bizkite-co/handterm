// src/contexts/CommandProvider.tsx
import type React from 'react';

import { type ParsedCommand } from '@handterm/types';
import { parseCommand } from 'src/utils/commandUtils';
import { navigate } from 'src/utils/navigationUtils';

import { type IHandTermWrapperMethods } from '../components/HandTermWrapper';
import { type IAuthProps } from '../hooks/useAuth';
import { useCommand } from '../hooks/useCommand';

import { CommandContext } from './CommandContext';


interface CommandProviderProps {
  children: React.ReactNode;
  handTermRef: React.RefObject<IHandTermWrapperMethods>;
  auth: IAuthProps;
}

export const CommandProvider: React.FC<CommandProviderProps> = ({ children, handTermRef, auth }) => {
  const {
    commandHistory,
    addToCommandHistory,
    output,
    appendToOutput,
    executeCommand: _executeCommand
  } = useCommand();


  const executeCommand = async (command: string) => {
    const parsedCommand: ParsedCommand = parseCommand(command);
    await _executeCommand(parsedCommand);
  };

  const contextValue = {
    commandHistory,
    addToCommandHistory,
    output,
    appendToOutput,
    handTermRef,
    auth,
    updateLocation: navigate,
    executeCommand
  };

  return (
    <CommandContext.Provider
      value={contextValue}>
      {children}
    </CommandContext.Provider>
  );
};
