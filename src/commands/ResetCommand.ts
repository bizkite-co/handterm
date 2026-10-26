import { navigate } from 'src/utils/navigationUtils';
import { ActivityType } from '@handterm/types';
import { type ICommand, type ICommandContext, type ICommandResponse } from '../contexts/CommandContext';
import { type ParsedCommand } from '../types/Types';
import {
  getNextTutorial,
  resetCompletedTutorials,
  setNextTutorial,
} from '../signals/tutorialSignals';
import {
  getNextGamePhrase,
  resetCompletedGamePhrases,
  setGameLevel,
  setGamePhrase,
} from '../signals/gameSignals';
import { createLogger } from '../utils/Logger';

const logger = createLogger({ prefix: 'ResetCommand' });

const AUTH_KEY_NAMES = new Set([
  'accesstoken',
  'refreshtoken',
  'idtoken',
  'expiresat',
  'expiresin',
  'githubusername',
  'github_access_token',
  'username',
]);

export function resetAll(): void {
  logger.info('Resetting all tutorial and game progress');
  resetCompletedTutorials();
  resetCompletedGamePhrases();
  setGameLevel(1);
  setGamePhrase(getNextGamePhrase());

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !AUTH_KEY_NAMES.has(key.toLowerCase()) && !key.toLowerCase().startsWith('auth_')) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
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
