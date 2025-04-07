import type { ICommand, ICommandResponse, ICommandContext } from '../contexts/CommandContext';
import { type ParsedCommand, StorageKeys, ActivityType } from '@handterm/types'; // Added ActivityType
import { getFile } from '../utils/awsApiClient';
import { createLogger } from '../utils/Logger'; // Re-added logger import

const logger = createLogger({ prefix: 'EditCommand' }); // Re-added logger instantiation

const EditCommand: ICommand = {
    name: 'edit',
    description: 'Edit file contents',
    execute: async (
        context: ICommandContext,
        parsedCommand: ParsedCommand,
    ): Promise<ICommandResponse> => {
        logger.debug('Executing edit command:', parsedCommand); // Log start
        if (parsedCommand.command.toLowerCase() === 'edit') {
            const filename = parsedCommand.args[0] ?? '_index.md';
            logger.debug(`Editing filename: ${filename}`); // Log filename

            try {
                // Check if file exists using AWS API
                logger.debug(`Calling getFile for: ${filename}`); // Log before getFile
                const response = await getFile(context.auth, filename);
                logger.debug(`getFile response received:`, { status: response.status, hasData: !!response.data, hasContent: !!response.data?.content }); // Log after getFile

                if (response.status !== 200 || !response.data) {
                    logger.warn(`File not found or error: ${response.status}`, response.error); // Log file not found
                    return {
                        status: response.status,
                        message: response.error ?? "File not found"
                    };
                }
                logger.debug('File found, proceeding.'); // Log success

                // Store content in local storage
                if (response.data != null && response.data.content != null ) {
                    const contentObj = JSON.stringify(response.data.content)
                    logger.debug('Setting editContent in localStorage...'); // Log before localStorage set
                    localStorage.setItem(
                        StorageKeys.editContent,
                        contentObj
                    );
                    logger.debug('localStorage set.'); // Log after localStorage set
                } else {
                     logger.warn('getFile response data or content is null/undefined.'); // Log missing content
                }

                // Update location to trigger activity mediator
                logger.debug('Calling context.updateLocation to switch activity to EDIT...'); // Log before updateLocation
                context.updateLocation({
                    activityKey: ActivityType.EDIT, // Use ActivityType enum
                    contentKey: filename,
                    groupKey: null
                });
                logger.debug('context.updateLocation called.'); // Log after updateLocation

                return {
                    status: 200,
                    message: "Editing file content" // This message goes to #output-container
                };
            } catch (error) {
                logger.error('Error during edit command execution:', error); // Log caught error
                // Handle any unexpected errors
                return {
                    status: 500,
                    message: error instanceof Error ? error.message : "Failed to access file"
                };
            }
        }

        logger.warn('Edit command name did not match "edit".'); // Log non-match
        return {
            status: 404,
            message: "Edit command not recognized"
        };
    }
};

export default EditCommand;
