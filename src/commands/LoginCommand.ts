// src/commands/LoginCommand.ts

import { isInLoginProcessSignal, tempUserNameSignal, setTempUserName, setIsInLoginProcess } from 'src/signals/appSignals';
import { type ICommand, type ICommandContext, type ICommandResponse } from '../contexts/CommandContext';
import { type ParsedCommand } from '../types/Types';
import { createLogger } from '../utils/Logger';

const logger = createLogger();

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
            if (tempUserNameSignal.value != username) {
                logger.error('Username mismatch');
            }

            return { status: 200, message: 'Enter password:', sensitive: true };
        } else if (parsedCommand.args.length === 2 && isInLoginProcessSignal.value) {
            // Complete login process
            const tempUsername = parsedCommand.args[0] ?? '';
            const password = parsedCommand.args[1] ?? '';

            try {
                const result = await auth.login(tempUsername, password);

                if (result.status !== 200 || result.data == null) {
                    return {
                        status: result.status,
                        message: result.message ?? 'Login failed',
                        sensitive: true
                    };
                }

                // Tokens are stored automatically by the login mutation's onSuccess handler
                setIsInLoginProcess(false);
                return {
                    status: 200,
                    message: 'Login successful!',
                    sensitive: true
                };
            } catch (error) {
                setIsInLoginProcess(false);
                let message = 'An unknown error occurred';
                if (error instanceof Error) {
                    message = error.message;
                } else if (typeof error === 'object' && error !== null && 'message' in error) {
                    message = (error as { message: string }).message;
                }

                // Avoid duplicating "Login error:" prefix
                const finalMessage = message.startsWith('Login error:')
                    ? message
                    : `Login error: ${message}`;

                return {
                    status: 500,
                    message: finalMessage,
                    sensitive: true
                };
            }
        } else {
            return { status: 400, message: 'Usage: login <username>' };
        }
    }
};
