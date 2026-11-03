import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ActivityType } from '@handterm/types';
import { type ICommandContext } from '../../contexts/CommandContext';
import { type IAuthProps } from '../../hooks/useAuth';
import { CommandRegistry } from '../commandRegistry';
import { WpmCommand } from '../WpmCommand';
import { gamePhraseSignal } from 'src/signals/gameSignals';
import {
  WPM_LEVEL_100_PHRASES,
  WPM_LEVEL_200_PHRASES,
  getWpmPhrase,
} from 'src/utils/wpmPhrases';

vi.mock('src/utils/navigationUtils', () => ({
  navigate: vi.fn(),
}));

import { navigate } from 'src/utils/navigationUtils';

const mockContext: ICommandContext = {
  executeCommand: async () => undefined,
  commandHistory: [],
  addToCommandHistory: () => undefined,
  output: [],
  appendToOutput: () => undefined,
  handTermRef: { current: null },
  auth: {} as IAuthProps,
  updateLocation: () => undefined,
};

describe('WpmCommand', () => {
  beforeEach(() => {
    vi.mocked(navigate).mockClear();
    gamePhraseSignal.value = null;
  });

  it('registers in CommandRegistry and appears in help', () => {
    expect(WpmCommand.name).toBe('wpm');
    const registry = new CommandRegistry();
    registry.register(WpmCommand);
    expect(registry.getHelp()).toContain('wpm');
    expect(registry.getHelp()).toContain('Typing speed test mode');
  });

  it('defaults to level 100 when invoked without args', async () => {
    const response = await WpmCommand.execute(mockContext, {
      command: 'wpm',
      args: [],
      switches: {},
    });

    expect(response.status).toBe(200);
    expect(response.message).toContain('Level 100');
    expect(gamePhraseSignal.value).not.toBeNull();
    expect(gamePhraseSignal.value?.displayAs).toBe('WPM');
    expect(gamePhraseSignal.value?.tutorialGroup).toBe('100');
    expect(navigate).toHaveBeenCalledWith({
      activityKey: ActivityType.WPM,
      contentKey: gamePhraseSignal.value?.key,
      groupKey: '100',
    });
  });

  it('starts level 100 when explicitly passed "100"', async () => {
    const response = await WpmCommand.execute(mockContext, {
      command: 'wpm',
      args: ['100'],
      switches: {},
    });

    expect(response.status).toBe(200);
    expect(response.message).toContain('Level 100');
    expect(gamePhraseSignal.value?.tutorialGroup).toBe('100');
  });

  it('starts level 200 when passed "200"', async () => {
    const response = await WpmCommand.execute(mockContext, {
      command: 'wpm',
      args: ['200'],
      switches: {},
    });

    expect(response.status).toBe(200);
    expect(response.message).toContain('Level 200');
    expect(gamePhraseSignal.value?.displayAs).toBe('WPM');
    expect(gamePhraseSignal.value?.tutorialGroup).toBe('200');
    expect(navigate).toHaveBeenCalledWith({
      activityKey: ActivityType.WPM,
      contentKey: gamePhraseSignal.value?.key,
      groupKey: '200',
    });
  });

  it('returns coming soon message for level 300 and 400', async () => {
    const res300 = await WpmCommand.execute(mockContext, {
      command: 'wpm',
      args: ['300'],
      switches: {},
    });
    expect(res300.status).toBe(200);
    expect(res300.message).toContain('Level 300');
    expect(res300.message).toContain('coming soon');

    const res400 = await WpmCommand.execute(mockContext, {
      command: 'wpm',
      args: ['400'],
      switches: {},
    });
    expect(res400.status).toBe(200);
    expect(res400.message).toContain('Level 400');
    expect(res400.message).toContain('coming soon');
  });

  it('returns error 400 for unknown level', async () => {
    const res = await WpmCommand.execute(mockContext, {
      command: 'wpm',
      args: ['999'],
      switches: {},
    });
    expect(res.status).toBe(400);
    expect(res.message).toContain('Unknown WPM level');
  });

  it('cancels speed test and returns to NORMAL on "cancel" or "stop"', async () => {
    const res = await WpmCommand.execute(mockContext, {
      command: 'wpm',
      args: ['cancel'],
      switches: {},
    });
    expect(res.status).toBe(200);
    expect(gamePhraseSignal.value).toBeNull();
    expect(navigate).toHaveBeenCalledWith({
      activityKey: ActivityType.NORMAL,
      contentKey: null,
      groupKey: null,
    });
  });
});

describe('wpmPhrases Bank Validation', () => {
  it('Level 100 phrases satisfy all character and length requirements', () => {
    expect(WPM_LEVEL_100_PHRASES.length).toBeGreaterThanOrEqual(3);

    for (const phrase of WPM_LEVEL_100_PHRASES) {
      // Around 250 characters
      expect(phrase.length).toBeGreaterThanOrEqual(230);
      expect(phrase.length).toBeLessThanOrEqual(270);

      // Contains all 26 letters
      const letters = new Set(phrase.toLowerCase().replace(/[^a-z]/g, ''));
      expect(letters.size).toBe(26);

      // Contains period and comma
      expect(phrase).toContain('.');
      expect(phrase).toContain(',');

      // Contains strictly only letters, period, comma, and space
      const unexpected = [...phrase].filter(c => !/[a-zA-Z,.\s]/.test(c));
      expect(unexpected).toEqual([]);
    }
  });

  it('Level 200 phrases contain all 26 letters and targeted punctuation symbols', () => {
    expect(WPM_LEVEL_200_PHRASES.length).toBeGreaterThanOrEqual(3);
    const requiredPunctuation = ['"', ';', "'", '?', '!', '$', '%', '&', '*', '/', '(', ')'];

    for (const phrase of WPM_LEVEL_200_PHRASES) {
      // Around 240-255 characters
      expect(phrase.length).toBeGreaterThanOrEqual(220);
      expect(phrase.length).toBeLessThanOrEqual(265);

      // Contains all 26 letters
      const letters = new Set(phrase.toLowerCase().replace(/[^a-z]/g, ''));
      expect(letters.size).toBe(26);

      // Contains each required punctuation symbol
      for (const punct of requiredPunctuation) {
        expect(phrase).toContain(punct);
      }
    }
  });

  it('getWpmPhrase alternates phrases across invocations', () => {
    const phraseA = getWpmPhrase(100);
    const phraseB = getWpmPhrase(100);
    expect(phraseA.key).not.toBe(phraseB.key);
    expect(phraseA.value).not.toBe(phraseB.value);
  });
});
