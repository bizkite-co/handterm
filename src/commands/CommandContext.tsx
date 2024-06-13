// CommandContext.tsx
import React from 'react';

export interface ICommandContext {
  commandHistory: string[]; // Assuming commandHistory is an array of strings
  videoRef: React.RefObject<HTMLVideoElement>;
  setCommand: React.Dispatch<React.SetStateAction<string[]>>;

  // Add other references and state setters as needed
}

// Create the context with a default value
export const CommandContext = React.createContext<ICommandContext | null>(null);