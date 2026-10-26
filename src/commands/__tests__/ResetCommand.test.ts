import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type ICommandContext } from 'src/contexts/CommandContext';
import { type ParsedCommand, ActivityType } from '@handterm/types';

import { ResetCommand, resetAll } from '../ResetCommand';
import * as tutorialSignals from 'src/signals/tutorialSignals';
import * as gameSignals from 'src/signals/gameSignals';
import * as navigationUtils from 'src/utils/navigationUtils';

vi.mock('src/signals/tutorialSignals', () => ({
  resetCompletedTutorials: vi.fn(),
  getNextTutorial: vi.fn(() => ({ key: 'a', value: 'a', tutorialGroup: 'home' })),
  setNextTutorial: vi.fn(),
}));

vi.mock('src/signals/gameSignals', () => ({
  resetCompletedGamePhrases: vi.fn(),
  setGameLevel: vi.fn(),
  getNextGamePhrase: vi.fn(() => ({ key: 'first-eight', value: 'All sad lads', tutorialGroup: 'single-click' })),
  setGamePhrase: vi.fn(),
}));

vi.mock('src/utils/navigationUtils', () => ({
  navigate: vi.fn(),
}));

describe('ResetCommand', () => {
  const createMockContext = (): ICommandContext => ({
    executeCommand: vi.fn(),
    commandHistory: [],
    addToCommandHistory: vi.fn(),
    output: [],
    appendToOutput: vi.fn(),
    handTermRef: { current: null },
    auth: {} as any,
    updateLocation: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resetAll', () => {
    it('resets tutorials, game phrases, sets game level to 1, and navigates to TUTORIAL', () => {
      resetAll();
      expect(tutorialSignals.resetCompletedTutorials).toHaveBeenCalledTimes(1);
      expect(gameSignals.resetCompletedGamePhrases).toHaveBeenCalledTimes(1);
      expect(gameSignals.setGameLevel).toHaveBeenCalledWith(1);
      expect(gameSignals.setGamePhrase).toHaveBeenCalled();
      expect(navigationUtils.navigate).toHaveBeenCalledWith({
        activityKey: ActivityType.TUTORIAL,
        contentKey: 'a',
        groupKey: 'home',
      });
    });

    it('clears all non-auth items from localStorage while preserving login credentials', () => {
      localStorage.setItem('AccessToken', 'secret-access-token');
      localStorage.setItem('RefreshToken', 'secret-refresh-token');
      localStorage.setItem('IdToken', 'secret-id-token');
      localStorage.setItem('userName', 'testuser');
      localStorage.setItem('completed-tutorials', '["a"]');
      localStorage.setItem('completed-game-phrases', '["g1"]');
      localStorage.setItem('phrasesAchieved', '["60:phrase1"]');
      localStorage.setItem('tutorial-state', '{"step": 1}');
      localStorage.setItem('handterm-has-visited', 'true');

      resetAll();

      expect(localStorage.getItem('AccessToken')).toBe('secret-access-token');
      expect(localStorage.getItem('RefreshToken')).toBe('secret-refresh-token');
      expect(localStorage.getItem('IdToken')).toBe('secret-id-token');
      expect(localStorage.getItem('userName')).toBe('testuser');
      expect(localStorage.getItem('completed-tutorials')).toBeNull();
      expect(localStorage.getItem('completed-game-phrases')).toBeNull();
      expect(localStorage.getItem('phrasesAchieved')).toBeNull();
      expect(localStorage.getItem('tutorial-state')).toBeNull();
      expect(localStorage.getItem('handterm-has-visited')).toBeNull();
    });
  });

  describe('execute', () => {
    it('resets all progress and returns a 200 status message', async () => {
      const context = createMockContext();
      const parsedCommand: ParsedCommand = {
        command: 'reset',
        args: [],
        switches: {},
      };

      const res = await ResetCommand.execute(context, parsedCommand);
      expect(res.status).toBe(200);
      expect(res.message).toContain('All tutorial and game progress has been reset');
      expect(tutorialSignals.resetCompletedTutorials).toHaveBeenCalledTimes(1);
      expect(gameSignals.resetCompletedGamePhrases).toHaveBeenCalledTimes(1);
      expect(gameSignals.setGameLevel).toHaveBeenCalledWith(1);
      expect(navigationUtils.navigate).toHaveBeenCalledWith({
        activityKey: ActivityType.TUTORIAL,
        contentKey: 'a',
        groupKey: 'home',
      });
    });

    it('returns a 500 error if resetting throws an exception', async () => {
      vi.mocked(tutorialSignals.resetCompletedTutorials).mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const context = createMockContext();
      const parsedCommand: ParsedCommand = {
        command: 'reset',
        args: [],
        switches: {},
      };

      const res = await ResetCommand.execute(context, parsedCommand);
      expect(res.status).toBe(500);
      expect(res.message).toBe('Failed to reset tutorial and game progress.');
    });
  });
});
