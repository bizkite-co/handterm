import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type ICommandContext } from 'src/contexts/CommandContext';
import { type ParsedCommand } from '@handterm/types';

import { ResetCommand, resetAll } from '../ResetCommand';
import * as tutorialSignals from 'src/signals/tutorialSignals';
import * as gameSignals from 'src/signals/gameSignals';

vi.mock('src/signals/tutorialSignals', () => ({
  resetCompletedTutorials: vi.fn(),
}));

vi.mock('src/signals/gameSignals', () => ({
  resetCompletedGamePhrases: vi.fn(),
  setGameLevel: vi.fn(),
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
    it('resets tutorials, game phrases, and sets game level to 1', () => {
      resetAll();
      expect(tutorialSignals.resetCompletedTutorials).toHaveBeenCalledTimes(1);
      expect(gameSignals.resetCompletedGamePhrases).toHaveBeenCalledTimes(1);
      expect(gameSignals.setGameLevel).toHaveBeenCalledWith(1);
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
      expect(res.message).toBe('All tutorial and game progress has been reset.');
      expect(tutorialSignals.resetCompletedTutorials).toHaveBeenCalledTimes(1);
      expect(gameSignals.resetCompletedGamePhrases).toHaveBeenCalledTimes(1);
      expect(gameSignals.setGameLevel).toHaveBeenCalledWith(1);
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
