// src/contexts/CommandProvider.tsx
import React from 'react';
import { CommandContext } from './CommandContext';
import { useCommand } from '../hooks/useCommand';
import { IAuthProps } from '../hooks/useAuth';
import { IHandTermWrapperMethods } from '../components/HandTermWrapper';
import { navigate } from 'src/utils/navigationUtils';
import { parseCommand } from 'src/utils/commandUtils';
import { ParsedCommand } from 'src/types/Types';

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
