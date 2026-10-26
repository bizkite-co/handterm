import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type ICommandContext } from '../../contexts/CommandContext';
import { type ParsedCommand, ActivityType, StorageKeys } from '@handterm/types';
import { VimTutCommand, startVimTutorial } from '../VimTutCommand';
import * as navigationUtils from '../../utils/navigationUtils';
import * as vimTutorialSignals from '../../signals/vimTutorialSignals';

vi.mock('../../utils/navigationUtils', () => ({
  navigate: vi.fn(),
}));

describe('VimTutCommand', () => {
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
    vimTutorialSignals.resetVimTutorial();
    localStorage.clear();
  });

  describe('startVimTutorial', () => {
    it('sets editContent in localStorage and navigates to EDIT activity with contentKey vimtut', () => {
      startVimTutorial(0);
      const stored = localStorage.getItem(StorageKeys.editContent);
      expect(stored).not.toBeNull();
      expect(navigationUtils.navigate).toHaveBeenCalledWith({
        activityKey: ActivityType.EDIT,
        contentKey: 'vimtut',
      });
    });
  });

  describe('execute', () => {
    it('starts tutorial at step 1 by default and returns status 200', async () => {
      const context = createMockContext();
      const parsedCommand: ParsedCommand = {
        command: 'vimtut',
        args: [],
        switches: {},
      };

      const res = await VimTutCommand.execute(context, parsedCommand);
      expect(res.status).toBe(200);
      expect(res.message).toContain('Starting Vim Tutor');
      expect(navigationUtils.navigate).toHaveBeenCalledWith({
        activityKey: ActivityType.EDIT,
        contentKey: 'vimtut',
      });
    });

    it('starts tutorial at specific step when step argument provided', async () => {
      const context = createMockContext();
      const parsedCommand: ParsedCommand = {
        command: 'vimtut',
        args: ['3'],
        switches: {},
      };

      const res = await VimTutCommand.execute(context, parsedCommand);
      expect(res.status).toBe(200);
      expect(vimTutorialSignals.vimTutorialStepIndexSignal.value).toBe(2);
    });
  });
});
