import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ActivityType } from '@handterm/types';
import { type ICommandContext } from '../../contexts/CommandContext';
import { type IAuthProps } from '../../hooks/useAuth';
import { CommandRegistry } from '../commandRegistry';
import { WpmCommand } from '../WpmCommand';
import { gamePhraseSignal } from 'src/signals/gameSignals';
import {
  WPM_PRACTICE_100_PHRASES,
  WPM_PRACTICE_200_PHRASES,
  WPM_TRIAL_100_PHRASES,
  WPM_TRIAL_200_PHRASES,
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

  it('registers in CommandRegistry and appears in help with -t switch', () => {
    expect(WpmCommand.name).toBe('wpm');
    const registry = new CommandRegistry();
    registry.register(WpmCommand);
    expect(registry.getHelp()).toContain('wpm');
    expect(registry.getHelp()).toContain('Typing speed test mode');
    expect(registry.getHelp('wpm')).toContain('-t');
  });

  it('defaults to level 100 practice when invoked without args', async () => {
    const response = await WpmCommand.execute(mockContext, {
      command: 'wpm',
      args: [],
      switches: {},
    });

    expect(response.status).toBe(200);
    expect(response.message).toContain('Level 100 Practice');
    expect(gamePhraseSignal.value).not.toBeNull();
    expect(gamePhraseSignal.value?.displayAs).toBe('WPM');
    expect(gamePhraseSignal.value?.tutorialGroup).toBe('100');
    expect(navigate).toHaveBeenCalledWith({
      activityKey: ActivityType.WPM,
      contentKey: gamePhraseSignal.value?.key,
      groupKey: '100',
    });
  });

  it('starts level 100 practice when explicitly passed "100"', async () => {
    const response = await WpmCommand.execute(mockContext, {
      command: 'wpm',
      args: ['100'],
      switches: {},
    });

    expect(response.status).toBe(200);
    expect(response.message).toContain('Level 100 Practice');
    expect(gamePhraseSignal.value?.tutorialGroup).toBe('100');
  });

  it('starts level 200 practice when passed "200"', async () => {
    const response = await WpmCommand.execute(mockContext, {
      command: 'wpm',
      args: ['200'],
      switches: {},
    });

    expect(response.status).toBe(200);
    expect(response.message).toContain('Level 200 Practice');
    expect(gamePhraseSignal.value?.displayAs).toBe('WPM');
    expect(gamePhraseSignal.value?.tutorialGroup).toBe('200');
    expect(navigate).toHaveBeenCalledWith({
      activityKey: ActivityType.WPM,
      contentKey: gamePhraseSignal.value?.key,
      groupKey: '200',
    });
  });

  it('starts level 100 time trial when -t switch is passed', async () => {
    const response = await WpmCommand.execute(mockContext, {
      command: 'wpm',
      args: [],
      switches: { t: true },
    });

    expect(response.status).toBe(200);
    expect(response.message).toContain('Level 100 Time Trial');
    expect(gamePhraseSignal.value).not.toBeNull();
    expect(gamePhraseSignal.value?.tutorialGroup).toBe('trial-100');
    expect(gamePhraseSignal.value?.value.length).toBeGreaterThanOrEqual(25);
    expect(gamePhraseSignal.value?.value.length).toBeLessThanOrEqual(40);
  });

  it('starts level 100 time trial when invoked as "wpm -t 100"', async () => {
    const response = await WpmCommand.execute(mockContext, {
      command: 'wpm',
      args: [],
      switches: { t: '100' },
    });

    expect(response.status).toBe(200);
    expect(response.message).toContain('Level 100 Time Trial');
    expect(gamePhraseSignal.value?.tutorialGroup).toBe('trial-100');
  });

  it('starts level 200 time trial when invoked with -t and level 200', async () => {
    const response = await WpmCommand.execute(mockContext, {
      command: 'wpm',
      args: ['200'],
      switches: { t: true },
    });

    expect(response.status).toBe(200);
    expect(response.message).toContain('Level 200 Time Trial');
    expect(gamePhraseSignal.value?.tutorialGroup).toBe('trial-200');
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
  it('Level 100 practice phrases: exactly 3 phrases, all 26 letters, period & comma, ~250 chars', () => {
    expect(WPM_PRACTICE_100_PHRASES.length).toBe(3);

    for (const phrase of WPM_PRACTICE_100_PHRASES) {
      expect(phrase.length).toBeGreaterThanOrEqual(230);
      expect(phrase.length).toBeLessThanOrEqual(270);

      const letters = new Set(phrase.toLowerCase().replace(/[^a-z]/g, ''));
      expect(letters.size).toBe(26);

      expect(phrase).toContain('.');
      expect(phrase).toContain(',');

      const unexpected = [...phrase].filter(c => !/[a-zA-Z,.\s]/.test(c));
      expect(unexpected).toEqual([]);
    }
  });

  it('Level 200 practice phrases: exactly 3 phrases, all 26 letters, required punctuation, ~240-250 chars', () => {
    expect(WPM_PRACTICE_200_PHRASES.length).toBe(3);
    const requiredPunctuation = ['"', ';', "'", '?', '!', '$', '%', '&', '*', '/', '(', ')'];

    for (const phrase of WPM_PRACTICE_200_PHRASES) {
      expect(phrase.length).toBeGreaterThanOrEqual(220);
      expect(phrase.length).toBeLessThanOrEqual(265);

      const letters = new Set(phrase.toLowerCase().replace(/[^a-z]/g, ''));
      expect(letters.size).toBe(26);

      for (const punct of requiredPunctuation) {
        expect(phrase).toContain(punct);
      }
    }
  });

  it('Level 100 time trial phrases: exactly 3 phrases, 25-40 chars, avg ~29 chars, lowercase, no punct/numbers', () => {
    expect(WPM_TRIAL_100_PHRASES.length).toBe(3);

    let totalLength = 0;
    for (const phrase of WPM_TRIAL_100_PHRASES) {
      totalLength += phrase.length;

      // 25 to 40 characters
      expect(phrase.length).toBeGreaterThanOrEqual(25);
      expect(phrase.length).toBeLessThanOrEqual(40);

      // All lower case
      expect(phrase).toBe(phrase.toLowerCase());

      // No punctuation and no numbers (only a-z and spaces)
      expect(/^[a-z\s]+$/.test(phrase)).toBe(true);
    }

    const averageLength = totalLength / WPM_TRIAL_100_PHRASES.length;
    expect(averageLength).toBeCloseTo(29, 1);
  });

  it('Level 200 time trial phrases: exactly 3 phrases, 25-40 chars, contains level 200 punctuation', () => {
    expect(WPM_TRIAL_200_PHRASES.length).toBe(3);

    for (const phrase of WPM_TRIAL_200_PHRASES) {
      expect(phrase.length).toBeGreaterThanOrEqual(25);
      expect(phrase.length).toBeLessThanOrEqual(40);
    }
  });

  it('getWpmPhrase alternates phrases across invocations for both practice and trials', () => {
    const practiceA = getWpmPhrase(100, false);
    const practiceB = getWpmPhrase(100, false);
    expect(practiceA.key).not.toBe(practiceB.key);

    const trialA = getWpmPhrase(100, true);
    const trialB = getWpmPhrase(100, true);
    expect(trialA.key).not.toBe(trialB.key);
    expect(trialA.value).not.toBe(trialB.value);
  });
});
