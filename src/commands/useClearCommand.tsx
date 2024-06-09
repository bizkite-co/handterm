// src/commands/ClearCommand.tsx
import { ICommandContext } from './CommandContext';

export const useClearCommand = (context: ICommandContext) => {
    
    return (args: string[]): string => {
        if(!context.outputRef.current) {
            return 'Output element not available.';
        }
        context.outputRef.current = '';
        return 'Output cleared.';
    }
};
