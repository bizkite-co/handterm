// src/commands/VerifyCommand.ts
import { tempUserNameSignal, setTempUserName, isInVerifyProcessSignal, setIsInVerifyProcess } from 'src/signals/appSignals';

import { type ICommand, type ICommandContext, type ICommandResponse } from '../contexts/CommandContext';
import { type ParsedCommand } from '../types/Types';

export const VerifyCommand: ICommand = {
    name: 'verify',
    description: 'Verify your account with the code sent to your email',
    execute: async (
        context: ICommandContext,
        _parsedCommand: ParsedCommand
    ): Promise<ICommandResponse> => {
        const { auth } = context;

        if (_parsedCommand.args.length === 1) {
            // Start verify process: verify <username>
            setIsInVerifyProcess(true);
            setTempUserName(_parsedCommand.args[0] ?? '');
            return { status: 200, message: 'Enter verification code:' };
        } else if (_parsedCommand.args.length === 2 && isInVerifyProcessSignal.value) {
            // Complete verify process: verify <username> <code>
            const username = tempUserNameSignal.value;
            const code = _parsedCommand.args[1] ?? '';

            try {
                const result = await auth.verify(username, code);
                setIsInVerifyProcess(false);

                if (result != null && typeof result === 'object') {
                    return {
                        status: 200,
                        message: 'Account verified successfully! You can now log in.'
                    };
                } else {
                    return {
                        status: 400,
                        message: 'Verification failed: invalid response from server'
                    };
                }
            } catch (error) {
                setIsInVerifyProcess(false);
                return {
                    status: 500,
                    message: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`
                };
            }
        } else {
            return { status: 400, message: 'Usage: verify <username>' };
        }
    }
};
