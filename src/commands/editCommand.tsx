import type { ICommand, ICommandResponse, ICommandContext } from '../contexts/CommandContext';
import { ActivityType, type ParsedCommand } from '@handterm/types';

const EditCommand: ICommand = {
    name: 'edit',
    description: 'Edit file contents',
    execute: async (
        context: ICommandContext,
        parsedCommand: ParsedCommand,
    ): Promise<ICommandResponse> => {
        if (parsedCommand.command.toLowerCase() === 'edit') {
            const filename = parsedCommand.args[0] ?? '_index.md';
            const content = localStorage.getItem('edit-content');

            // Check if file exists
            if (!content) {
                return Promise.resolve({ status: 404, message: "File not found" });
            }

            // Set activity state directly
            window.setActivity(ActivityType.EDIT);

            // Update location
            context.updateLocation({
                activityKey: ActivityType.EDIT,
                contentKey: filename,
                groupKey: null
            });

            return Promise.resolve({ status: 200, message: "Editing file content" });
        }
        return Promise.resolve({ status: 404, message: "Edit command not recognized" });
    }
};

export default EditCommand;
