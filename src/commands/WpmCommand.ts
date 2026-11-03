import { navigate } from 'src/utils/navigationUtils';
import { type ICommand, type ICommandContext, type ICommandResponse } from '../contexts/CommandContext';
import { ActivityType } from '@handterm/types';
import type { ParsedCommand } from '../types/Types';
import { setGamePhrase } from 'src/signals/gameSignals';
import { getWpmPhrase } from 'src/utils/wpmPhrases';
import { createLogger } from '../utils/Logger';

const logger = createLogger({ prefix: 'WpmCommand' });

export const WpmCommand: ICommand = {
  name: 'wpm',
  description: 'Typing speed test mode (wpm [100|200] [-t])',
  switches: {
    t: 'Run time trial phrase (short 25-40 char sprint) instead of practice',
  },
  execute: async (
    _context: ICommandContext,
    parsedCommand: ParsedCommand,
  ): Promise<ICommandResponse> => {
    try {
      const tSwitch = parsedCommand.switches.t ?? parsedCommand.switches.trial;
      const isTrial = Boolean(tSwitch);

      let rawArg: string | undefined;
      if (typeof tSwitch === 'string') {
        rawArg = tSwitch.trim().toLowerCase();
      } else if (parsedCommand.args[0]) {
        rawArg = parsedCommand.args[0].trim().toLowerCase();
      }

      if (rawArg === 'cancel' || rawArg === 'stop') {
        setGamePhrase(null);
        navigate({
          activityKey: ActivityType.NORMAL,
          contentKey: null,
          groupKey: null,
        });
        return {
          status: 200,
          message: 'WPM typing speed test cancelled.',
        };
      }

      if (rawArg === '300') {
        return {
          status: 200,
          message: 'WPM Level 300 (full US keyboard characters) is coming soon!',
        };
      }

      if (rawArg === '400') {
        return {
          status: 200,
          message: 'WPM Level 400 (newlines, tabs, and formatting) is coming soon!',
        };
      }

      let level = 100;
      if (rawArg === '200') {
        level = 200;
      } else if (rawArg && rawArg !== '100') {
        return {
          status: 400,
          message: `Unknown WPM level: "${rawArg}". Supported levels: 100 (basic alphabet & punctuation), 200 (common punctuation & symbols). Usage: wpm [-t] [100|200]`,
        };
      }

      const phrase = getWpmPhrase(level, isTrial);
      setGamePhrase(phrase);
      navigate({
        activityKey: ActivityType.WPM,
        contentKey: phrase.key,
        groupKey: phrase.tutorialGroup ?? String(level),
      });

      const modeLabel = isTrial ? 'Time Trial' : 'Practice';
      return {
        status: 200,
        message: `Starting WPM Level ${level} ${modeLabel} (~${phrase.value.length} characters). Type the text shown above. Press Ctrl+C to abort.`,
      };
    } catch (error: unknown) {
      logger.error('Wpm command error:', error);
      return {
        status: 500,
        message: 'Failed to start WPM speed test',
      };
    }
  },
};

export default WpmCommand;
