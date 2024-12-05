import { ICommand, ICommandContext } from '../contexts/CommandContext';
import { ParsedCommand } from '../types/Types';
import { isShowVideoSignal } from '../signals/appSignals';
import { ReactNode } from 'react';

export const toggleVideoCommand: ICommand = {
    name: 'video',
    description: 'Toggle webcam video on/off',
    execute: async (context: ICommandContext, parsedCommand: ParsedCommand) => {
        isShowVideoSignal.value = !isShowVideoSignal.value;
        context.appendToOutput({
            response: `Video ${isShowVideoSignal.value ? 'enabled' : 'disabled'}` as ReactNode,
            status: 200,
            command: parsedCommand,
            commandTime: new Date(),
        });
        return {
            status: 0,
            message: 'Success',
        };
    }
};

export default toggleVideoCommand;