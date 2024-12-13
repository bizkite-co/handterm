import { ICommand, ICommandResponse } from '../contexts/CommandContext';
import { ICommandContext } from '../contexts/CommandContext';
import { ActivityType, ParsedCommand } from '../types/Types';

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
                contentKey: parsedCommand.args[0] || '_index.md',
                groupKey: null
            })
            return { status: 200, message: "Editing file content" };
        }
        return { status: 404, message: "Help command not recognized" };
    }
};

export default EditCommand;
