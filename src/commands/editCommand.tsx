import type { ICommand, ICommandResponse, ICommandContext } from '../contexts/CommandContext';
import type { ParsedCommand } from '../types/Types';
import { ActivityType } from '../types/Types';

const EditCommand: ICommand = {
    name: 'edit',
    description: 'Edit file contents',
    execute: async (
        context: ICommandContext,
        parsedCommand: ParsedCommand,
    ): Promise<ICommandResponse> => {
        if (parsedCommand.command.toLowerCase() === 'edit') {
            context.updateLocation({
                activityKey: ActivityType.EDIT,
                contentKey: parsedCommand.args[0] ?? '_index.md',
                groupKey: null
            })
            return Promise.resolve({ status: 200, message: "Editing file content" });
        }
        return Promise.resolve({ status: 404, message: "Edit command not recognized" });
    }
};

export default EditCommand;
