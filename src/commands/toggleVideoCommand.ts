import { ICommand, ICommandContext, ICommandResponse } from '../contexts/CommandContext';
import { ParsedCommand } from '../types/Types';
import { isShowVideoSignal } from '../signals/appSignals';
import { ReactNode } from 'react';

export const toggleVideoCommand: ICommand = {
    name: 'video',
    description: 'Toggle webcam video on/off',
    execute: async (
        context: ICommandContext, parsedCommand: ParsedCommand
    ): Promise<ICommandResponse> => {
        isShowVideoSignal.value = !isShowVideoSignal.value;
        return {
            status: 200,
            message: `Video ${isShowVideoSignal.value ? 'enabled' : 'disabled'}`,
        };
    }
};

export default toggleVideoCommand;