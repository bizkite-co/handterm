// src/commands/ICommands.ts
import { RefObject } from "react";
import { IHandTermWrapperMethods } from "../components/HandTermWrapper";

export interface ICommandResponse {
    status: number;
    message: string;
}

export interface ICommand {                                                                              
   name: string;                                                                                          
   description: string;                                                                                   
   switches?: Record<string, string>; // Switches with their descriptions                                 
   execute: (                                                                                             
     commandName: string,                                                                                 
     args?: string[],                                                                                     
     switches?: Record<string, boolean | string>,                                                         
     handTermRef?: RefObject<IHandTermWrapperMethods>                                                     
   ) => ICommandResponse;                                                                                 
 }                          