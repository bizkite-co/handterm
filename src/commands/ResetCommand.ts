import { type ICommand, type ICommandContext, type ICommandResponse } from '../contexts/CommandContext';
import { type ParsedCommand } from '../types/Types';
import { resetCompletedTutorials } from '../signals/tutorialSignals';
import { resetCompletedGamePhrases, setGameLevel } from '../signals/gameSignals';
import { createLogger } from '../utils/Logger';

const logger = createLogger({ prefix: 'ResetCommand' });

export function resetAll(): void {
  logger.info('Resetting all tutorial and game progress');
  resetCompletedTutorials();
  resetCompletedGamePhrases();
  setGameLevel(1);
}

export const ResetCommand: ICommand = {
  name: 'reset',
  description: 'Reset all tutorial and game progress',
  execute: async (
    _context: ICommandContext,
    _parsedCommand: ParsedCommand
  ): Promise<ICommandResponse> => {
    try {
      resetAll();
      return {
        status: 200,
        message: 'All tutorial and game progress has been reset.',
      };
    } catch (error: unknown) {
      logger.error('Reset command error:', error);
      return {
        status: 500,
        message: 'Failed to reset tutorial and game progress.',
      };
    }
  },
};

export default ResetCommand;
