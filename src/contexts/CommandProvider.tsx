// src/contexts/CommandProvider.tsx
import React from 'react';
import { CommandContext } from './CommandContext';
import { useCommand } from '../hooks/useCommand';
import { IAuthProps } from '../lib/useAuth';
import { IHandTermWrapperMethods } from '../components/HandTermWrapper';
import { useReactiveLocation } from 'src/hooks/useReactiveLocation';

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
  } = useCommand();

  const { updateLocation } = useReactiveLocation();

  const contextValue = {
    commandHistory,
    addToCommandHistory,
    output,
    appendToOutput,
    handTermRef,
    auth,
    updateLocation
  };

  return (
    <CommandContext.Provider value={contextValue}>
      {children}
    </CommandContext.Provider>
  );
};