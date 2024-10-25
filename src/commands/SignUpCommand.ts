// src/commands/SignUpCommand.ts
import { ICommand, ICommandContext, ICommandResponse } from '../contexts/CommandContext';
import { ParsedCommand, MyResponse } from '../types/Types';
import { tempUserNameSignal, setTempEmail, tempEmailSignal, setTempUserName, tempPasswordSignal, isInSignUpProcessSignal, setIsInSignUpProcess } from 'src/signals/appSignals';

export const SignUpCommand: ICommand = {
    name: 'signup',
    description: 'Create a new account',
    execute: (context: ICommandContext, parsedCommand: ParsedCommand): ICommandResponse => {
        const { auth } = context;

        if (parsedCommand.args.length === 2) {
            // Start signup process
            setIsInSignUpProcess(true);
            setTempUserName(parsedCommand.args[0]);
            setTempEmail(parsedCommand.args[1])
            return { status: 200, message: 'Enter password:' };
        } else if (parsedCommand.args.length === 3 && isInSignUpProcessSignal.value) {
            // Complete signup process
            const username = tempUserNameSignal.value;
            const password = tempPasswordSignal.value;
            const email = tempEmailSignal.value;
            
            auth.signup({ username, password, email })
                .then((result: MyResponse<unknown>) => {
                    setIsInSignUpProcess(false);
                    if (result.status === 200) {
                        context.appendToOutput({
                            command: 'signup',
                            response: 'Account created successfully! Please check your email for verification.',
                            status: 200,
                            commandTime: new Date()
                        });
                    } else {
                        context.appendToOutput({
                            command: 'signup',
                            response: `Signup failed: ${result.message}`,
                            status: result.status,
                            commandTime: new Date()
                        });
                    }
                })
                .catch((error: Error) => {
                    setIsInSignUpProcess(false);
                    context.appendToOutput({
                        command: 'signup',
                        response: `Signup error: ${error.message}`,
                        status: 500,
                        commandTime: new Date()
                    });
                });

            return { status: 202, message: 'Processing signup...' };
        } else {
            return { status: 400, message: 'Usage: signup <username> <email>' };
        }
    }
};
