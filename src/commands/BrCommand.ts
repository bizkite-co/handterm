import { navigate } from 'src/utils/navigationUtils';
import { type ICommand, type ICommandContext, type ICommandResponse } from '../contexts/CommandContext';
import { ActivityType } from '@handterm/types';
import type { ParsedCommand } from '../types/Types';
import { createLogger } from '../utils/Logger';

const logger = createLogger({ prefix: 'BrCommand' });

function initialPath(args: string[]): string {
  const target = args[0]?.trim().toLowerCase() ?? '';
  if (target === 's3' || target === 'github' || target === 'gh') {
    return target === 'gh' ? 'github' : target;
  }
  return '';
}

export const BrCommand: ICommand = {
  name: 'br',
  aliases: ['y'],
  description: 'Browse GitHub and S3 files (Yazi-style miller columns)',
  execute: async (
    _context: ICommandContext,
    parsedCommand: ParsedCommand,
  ): Promise<ICommandResponse> => {
    try {
      const contentKey = initialPath(parsedCommand.args);
      navigate({
        activityKey: ActivityType.BROWSE,
        contentKey: contentKey === '' ? null : contentKey,
        groupKey: null,
      });
      return {
        status: 200,
        message: 'File browse. h/j/k/l to move, Enter to open, Escape to leave.',
      };
    } catch (error: unknown) {
      logger.error('Browse command error:', error);
      return {
        status: 500,
        message: 'Failed to open file browse',
      };
    }
  },
};

export default BrCommand;
