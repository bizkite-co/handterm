import { navigate } from "src/utils/navigationUtils";
import { type ICommand, type ICommandContext, type ICommandResponse } from "../contexts/CommandContext.js";
import { ActivityType } from '@handterm/types';
import type { ParsedCommand } from "../types/Types";
import { getNextTutorial, setNextTutorial } from "src/signals/tutorialSignals.js";
import { createLogger } from "../utils/Logger.js";

const logger = createLogger({ prefix: "TutCommand" });

export const TutCommand: ICommand = {
  name: 'tut',
  description: 'Return to the tutorials',
  execute: async (
    _context: ICommandContext,
    _parsedCommand: ParsedCommand
  ): Promise<ICommandResponse> => {
    try {
      const nextTutorial = getNextTutorial();
      setNextTutorial(nextTutorial);
      navigate({
        activityKey: ActivityType.TUTORIAL,
        contentKey: nextTutorial?.key ?? null,
        groupKey: nextTutorial?.tutorialGroup ?? null
      });
      return {
        status: 200,
        message: nextTutorial != null
          ? `Tutorial: ${nextTutorial.value}`
          : 'No tutorials remaining.',
      };
    } catch (error: unknown) {
      logger.error('Tutorial command error:', error);
      return {
        status: 500,
        message: 'Failed to start the tutorial',
      };
    }
  },
};