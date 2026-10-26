import { navigate } from 'src/utils/navigationUtils';
import { ActivityType, StorageKeys } from '@handterm/types';
import { type ICommand, type ICommandContext, type ICommandResponse } from '../contexts/CommandContext';
import { type ParsedCommand } from '../types/Types';
import {
  getNextTutorial,
  resetCompletedTutorials,
  setNextTutorial,
} from '../signals/tutorialSignals';
import { resetCompletedGamePhrases, setGameLevel } from '../signals/gameSignals';
import { createLogger } from '../utils/Logger';

const logger = createLogger({ prefix: 'ResetCommand' });

export function resetAll(): void {
  logger.info('Resetting all tutorial and game progress');
  resetCompletedTutorials();
  resetCompletedGamePhrases();
  setGameLevel(1);

  try {
    localStorage.removeItem(StorageKeys.completedTutorials);
    localStorage.removeItem('completed-game-phrases');
    localStorage.removeItem('game-level');
    localStorage.removeItem(StorageKeys.hasVisited);
  } catch (e) {
    logger.warn('Failed to remove keys from localStorage during reset:', e);
  }

  const nextTutorial = getNextTutorial();
  setNextTutorial(nextTutorial);
  navigate({
    activityKey: ActivityType.TUTORIAL,
    contentKey: nextTutorial?.key ?? null,
    groupKey: nextTutorial?.tutorialGroup ?? null,
  });
}

export const ResetCommand: ICommand = {
  name: 'reset',
  description: 'Reset all tutorial and game progress and start tutorials',
  execute: async (
    _context: ICommandContext,
    _parsedCommand: ParsedCommand
  ): Promise<ICommandResponse> => {
    try {
      resetAll();
      return {
        status: 200,
        message: 'All tutorial and game progress has been reset. Tutorial started.',
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
