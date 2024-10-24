// src/commands/LoginCommand.ts

import { ICommand, ICommandContext, ICommandResponse } from '../contexts/CommandContext';
import { ParsedCommand } from '../types/Types';
import { isInLoginProcessSignal, tempUserNameSignal, setTempUserName, setIsInLoginProcess } from 'src/signals/appSignals';

export const LoginCommand: ICommand = {
    name: 'login',
    description: 'Log in to the system',
    execute: (context: ICommandContext, parsedCommand: ParsedCommand): ICommandResponse => {
        const { auth } = context;

        if (parsedCommand.args.length === 1) {
            // Start login process
            setIsInLoginProcess(true);
            setTempUserName(parsedCommand.args[0]);
            return { status: 200, message: 'Enter password:' };
        } else if (parsedCommand.args.length === 2 && isInLoginProcessSignal.value) {
            // Complete login process
            const tempUsername = parsedCommand.args[0];
            const password = parsedCommand.args[1]; // The entire command is the password in this case
            
            auth.login(tempUsername, password)
                .then(result => {
                    setIsInLoginProcess(false);
                    if (result.status === 200) {
                        context.appendToOutput({
                            command: 'login',
                            response: 'Login successful!',
                            status: 200,
                            commandTime: new Date()
                        });
                    } else {
                        context.appendToOutput({
                            command: 'login',
                            response: `Login failed: ${result.message}`,
                            status: result.status,
                            commandTime: new Date()
                        });
                    }
                })
                .catch(error => {
                    setIsInLoginProcess(false);
                    context.appendToOutput({
                        command: 'login',
                        response: `Login error: ${error.message}`,
                        status: 500,
                        commandTime: new Date()
                    });
                });

            return { status: 202, message: 'Processing login...' };
        } else {
            return { status: 400, message: 'Usage: login <username>' };
        }
    }
};