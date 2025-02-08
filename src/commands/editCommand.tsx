import type { ICommand, ICommandResponse, ICommandContext } from '../contexts/CommandContext';
import { ActivityType, type ParsedCommand } from '@handterm/types';
import { getFile } from '../utils/awsApiClient';

const EditCommand: ICommand = {
    name: 'edit',
    description: 'Edit file contents',
    execute: async (
        context: ICommandContext,
        parsedCommand: ParsedCommand,
    ): Promise<ICommandResponse> => {
        if (parsedCommand.command.toLowerCase() === 'edit') {
            const filename = parsedCommand.args[0] ?? '_index.md';

            try {
                // Check if file exists using AWS API
                const response = await getFile(context.auth, filename);

                if (response.status !== 200 || !response.data) {
                    return {
                        status: response.status,
                        message: response.error ?? "File not found"
                    };
                }

                // Set activity state directly
                window.setActivity(ActivityType.EDIT);

                // Update location
                context.updateLocation({
                    activityKey: ActivityType.EDIT,
                    contentKey: filename,
                    groupKey: null
                });

                return {
                    status: 200,
                    message: "Editing file content"
                };
            } catch (error) {
                // Handle any unexpected errors
                return {
                    status: 500,
                    message: error instanceof Error ? error.message : "Failed to access file"
                };
            }
        }

        return {
            status: 404,
            message: "Edit command not recognized"
        };
    }
};

export default EditCommand;
