// CommandContext.tsx
import React from 'react';

export interface ICommandContext {
  videoRef: React.RefObject<HTMLVideoElement>;
  // Add other references and state setters as needed
}

// Create the context with a default value
export const CommandContext = React.createContext<ICommandContext | null>(null);