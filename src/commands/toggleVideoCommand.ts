import { ICommand, ICommandContext, ICommandResponse } from '../contexts/CommandContext';
import { isShowVideoSignal } from '../signals/appSignals';
import { ParsedCommand } from '../types/Types';

export const toggleVideoCommand: ICommand = {
    name: 'video',
    description: 'Toggle webcam video on/off',
    execute: async (
        _context: ICommandContext,
        _parsedCommand: ParsedCommand
    ): Promise<ICommandResponse> => {
        isShowVideoSignal.value = !isShowVideoSignal.value;
        return {
            status: 200,
            message: `Video ${isShowVideoSignal.value ? 'enabled' : 'disabled'}`,
        };
    }
};

export default toggleVideoCommand;
