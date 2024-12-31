import { type ICommand, type ICommandContext, type ICommandResponse } from '../contexts/CommandContext';
import { isShowVideoSignal } from '../signals/appSignals';
import { type ParsedCommand } from '../types/Types';

export const toggleVideoCommand: ICommand = {
    name: 'video',
    description: 'Toggle webcam video on/off',
    execute: (
        _context: ICommandContext,
        _parsedCommand: ParsedCommand
    ): Promise<ICommandResponse> => {
        isShowVideoSignal.value = !isShowVideoSignal.value;
        return Promise.resolve({
            status: 200,
            message: `Video ${isShowVideoSignal.value ? 'enabled' : 'disabled'}`,
        });
    }
};

export default toggleVideoCommand;
