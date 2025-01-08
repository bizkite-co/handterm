// src/commands/LoginCommand.ts

import { isInLoginProcessSignal, tempUserNameSignal, setTempUserName, setIsInLoginProcess } from 'src/signals/appSignals';
import { type AuthResponse } from 'src/constants/tokens';

import { type ICommand, type ICommandContext, type ICommandResponse } from '../contexts/CommandContext';
import { type ParsedCommand } from '../types/Types';
import { createLogger } from '../utils/Logger';

const logger = createLogger();

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
            const username = parsedCommand.args[0] ?? '';
            setTempUserName(username);

            // Demonstrate usage of tempUserNameSignal
            if (tempUserNameSignal.value !== username) {
                logger.error('Username mismatch');
            }

            return { status: 200, message: 'Enter password:' };
        } else if (parsedCommand.args.length === 2 && isInLoginProcessSignal.value) {
            // Complete login process
            const tempUsername = parsedCommand.args[0] ?? '';
            const password = parsedCommand.args[1] ?? '';

            try {
                const result = await auth.login(tempUsername, password);
                if (result.data == null) {
                    return {
                        status: 500,
                        message: 'Login failed: No response data',
                        sensitive: true
                    };
                }
                const authResponse = result.data as unknown as AuthResponse;
                setIsInLoginProcess(false);

                if (result.status === 200 && authResponse.AccessToken != null ) {
                    try {
                        localStorage.setItem('accessToken', authResponse.AccessToken);
                        return {
                            status: 200,
                            message: 'Login successful!',
                            sensitive: true
                        };
                    } catch (error) {
                        return {
                            status: 500,
                            message: 'Login succeeded but failed to store token',
                            sensitive: true
                        };
                    }
                }

                return {
                    status: result.status,
                    message: `Login failed: ${result.message}`,
                    sensitive: true
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
