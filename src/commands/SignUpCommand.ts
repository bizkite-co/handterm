// src/commands/SignUpCommand.ts
import { ICommand, ICommandContext, ICommandResponse } from '../contexts/CommandContext';
import { ParsedCommand } from '../types/Types';
import { tempUserNameSignal, setTempEmail, tempEmailSignal, setTempUserName, tempPasswordSignal, isInSignUpProcessSignal, setIsInSignUpProcess } from 'src/signals/appSignals';

export const SignUpCommand: ICommand = {
    name: 'signup',
    description: 'Create a new account',
    execute: async (
        context: ICommandContext, 
        _parsedCommand: ParsedCommand
    ): Promise<ICommandResponse> => {
        const { auth } = context;

        if (_parsedCommand.args.length === 2) {
            // Start signup process
            setIsInSignUpProcess(true);
            setTempUserName(_parsedCommand.args[0]);
            setTempEmail(_parsedCommand.args[1])
            return { status: 200, message: 'Enter password:' };
        } else if (_parsedCommand.args.length === 3 && isInSignUpProcessSignal.value) {
            // Complete signup process
            const username = tempUserNameSignal.value;
            const password = tempPasswordSignal.value;
            const email = tempEmailSignal.value;
            
            try {
                const result = await auth.signup({ username, password, email });
                setIsInSignUpProcess(false);
                
                if (result.status === 200) {
                    return {
                        status: 200,
                        message: 'Account created successfully! Please check your email for verification.'
                    };
                } else {
                    return {
                        status: result.status,
                        message: `Signup failed: ${result.message}`
                    };
                }
            } catch (error) {
                setIsInSignUpProcess(false);
                return {
                    status: 500,
                    message: `Signup error: ${error instanceof Error ? error.message : 'Unknown error'}`
                };
            }
        } else {
            return { status: 400, message: 'Usage: signup <username> <email>' };
        }
    }
};
