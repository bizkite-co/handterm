import { type ICommand, type ICommandContext, type ICommandResponse } from '../contexts/CommandContext';
import { type ParsedCommand } from '../types/Types';
import { listFiles } from '../utils/awsApiClient';
import { createLogger } from '../utils/Logger';

const logger = createLogger({ prefix: 'ListPhrasesCommand' });

export const ListPhrasesCommand: ICommand = {
  name: 'ls',
  description: 'List files',
  switches: {},
  execute: async (
    context: ICommandContext,
    _parsedCommand: ParsedCommand
  ): Promise<ICommandResponse> => {
    if (context === null || context === undefined) {
      return Promise.resolve({ status: 404, message: 'No command context available.' });
    }

    try {
      const response = await listFiles(context.auth);
      if (response.status !== 200 || !response.data) {
        return {
          status: response.status,
          message: response.error ?? 'Failed to list files'
        };
      }

      const files = response.data.files;
      if (files.length === 0) {
        return { status: 200, message: 'No files found.' };
      }

      return {
        status: 200,
        message: files.join('\n')
      };
    } catch (error) {
      logger.error('Error listing files:', error);
      return {
        status: 500,
        message: error instanceof Error ? error.message : 'Failed to list files'
      };
    }
  }
};
