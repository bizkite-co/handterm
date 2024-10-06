// src/commands/CommandContext.tsx
import React from 'react';
import { ICommandResponse } from '../commands/ICommand';
import { IAuthProps } from 'src/lib/useAuth';
import { useActivityMediatorReturn } from 'src/hooks/useActivityMediator';

export interface ICommandContext {                                                 
   commandHistory: string[];                                                        
   appendToOutput: (element: React.ReactNode) => void;                              
   executeCommand: (                                                                
     commandName: string,                                                           
     args?: string[],                                                               
     switches?: Record<string, boolean | string>,                                   
   ) => ICommandResponse;                                                           
   setEditMode: (isEditMode: boolean) => void;                                      
   handleEditSave: (content: string) => void;                                       
   auth: IAuthProps;
   activityMediator: useActivityMediatorReturn;
   // Add any other methods that commands might need                                
 }                             

// Create the context with a default value
export const CommandContext = React.createContext<ICommandContext | null>(null);