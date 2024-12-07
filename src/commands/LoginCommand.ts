// src/commands/LoginCommand.ts

import { ICommand, ICommandContext, ICommandResponse } from '../contexts/CommandContext';
import { ParsedCommand } from '../types/Types';
import { isInLoginProcessSignal, tempUserNameSignal, setTempUserName, setIsInLoginProcess } from 'src/signals/appSignals';

interface LoginErrorResponse {
    status: number;
    message: string;
}

export const LoginCommand: ICommand = {
    name: 'login',
    description: 'Log in to the system',
    execute: async (context: ICommandContext, parsedCommand: ParsedCommand): Promise<ICommandResponse> => {
        const { auth } = context;

        if (parsedCommand.args.length === 1) {
            // Start login process
            setIsInLoginProcess(true);
            setTempUserName(parsedCommand.args[0]);
            return { status: 200, message: 'Enter password:' };
        } else if (parsedCommand.args.length === 2 && isInLoginProcessSignal.value) {
            // Complete login process
            const tempUsername = parsedCommand.args[0];
            const password = parsedCommand.args[1];

            try {
                const result = await auth.login(tempUsername, password);
                setIsInLoginProcess(false);

                return {
                    status: result.status,
                    message: result.status === 200 ? 'Login successful!' : `Login failed: ${result.message}`,
                    sensitive: true // Mark as sensitive to mask password
                };
            } catch (error) {
                setIsInLoginProcess(false);

                // Type narrowing for error
                const errorResponse: LoginErrorResponse =
                    error instanceof Error
                    ? { status: 500, message: error.message }
                    : { status: 500, message: 'An unknown error occurred' };

                return {
                    status: errorResponse.status,
                    message: `Login error: ${errorResponse.message}`,
                    sensitive: true // Mark as sensitive to mask password
                };
            }
        } else {
            return { status: 400, message: 'Usage: login <username>' };
        }
    }
};
