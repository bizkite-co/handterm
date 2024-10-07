// src/contexts/CommandProvider.tsx
import React from 'react';
import { CommandContext } from './CommandContext';
import { useCommand } from '../hooks/useCommand';
import { IAuthProps } from '../lib/useAuth';
import { IHandTermWrapperMethods } from '../components/HandTermWrapper';

interface CommandProviderProps {
  children: React.ReactNode;
  handTermRef: React.RefObject<IHandTermWrapperMethods>;
  auth: IAuthProps;
}

export const CommandProvider: React.FC<CommandProviderProps> = ({ children, handTermRef, auth }) => {
  const {
    executeCommand,
    commandHistory,
    addToCommandHistory,
    output,
    appendToOutput
  } = useCommand();

  const contextValue = {
    executeCommand,
    commandHistory,
    addToCommandHistory,
    output,
    appendToOutput,
    handTermRef,
    auth
  };

  return (
    <CommandContext.Provider value={contextValue}>
      {children}
    </CommandContext.Provider>
  );
};