import { IHandTermMethods } from "../components/HandTerm";

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
        handTerm?: React.RefObject<IHandTermMethods>
    ) => ICommandResponse;
}