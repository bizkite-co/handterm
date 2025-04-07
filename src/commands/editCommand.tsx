import type { ICommand, ICommandResponse, ICommandContext } from '../contexts/CommandContext';
import { type ParsedCommand, StorageKeys } from '@handterm/types';
import { getFile } from '../utils/awsApiClient';
// Removed logger import

// Removed logger instantiation

const EditCommand: ICommand = {
    name: 'edit',
    description: 'Edit file contents',
    execute: async (
        context: ICommandContext,
        parsedCommand: ParsedCommand,
    ): Promise<ICommandResponse> => {
        // Removed log
        if (parsedCommand.command.toLowerCase() === 'edit') {
            const filename = parsedCommand.args[0] ?? '_index.md';
            // Removed log

            try {
                // Check if file exists using AWS API
                // Removed log
                const response = await getFile(context.auth, filename);
                // Removed log

                if (response.status !== 200 || !response.data) {
                    // Removed log
                    return {
                        status: response.status,
                        message: response.error ?? "File not found"
                    };
                }
                // Removed log

                // Store content in local storage
                if (response.data != null && response.data.content != null ) {
                    const contentObj = JSON.stringify(response.data.content)
                    localStorage.setItem(
                        StorageKeys.editContent,
                        contentObj
                    );
                    // Removed log
                } else {
                     // Removed log
                }

                // Update location to trigger activity mediator
                // Removed log
                context.updateLocation({
                    activityKey: 'edit',
                    contentKey: filename,
                    groupKey: null
                });
                // Removed log

                return {
                    status: 200,
                    message: "Editing file content" // This message goes to #output-container
                };
            } catch (error) {
                // Removed log
                // Handle any unexpected errors
                return {
                    status: 500,
                    message: error instanceof Error ? error.message : "Failed to access file"
                };
            }
        }

        // Removed log
        return {
            status: 404,
            message: "Edit command not recognized"
        };
    }
};

export default EditCommand;
