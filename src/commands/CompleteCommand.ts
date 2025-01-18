import { navigate } from "src/utils/navigationUtils";
import { type ICommand, type ICommandContext, type ICommandResponse } from "../contexts/CommandContext.js";
import { ActivityType, allTutorialPhraseNames, type ParsedCommand } from "../types/Types";
import { createLogger } from "../utils/Logger.js";

const logger = createLogger({ prefix: "CompleteCommand" });

export const CompleteCommand: ICommand = {
  name: 'complete',
  description: 'Mark tutorials as completed',
  switches: {},
  execute: async (
    _context: ICommandContext,
    _parsedCommand: ParsedCommand
  ): Promise<ICommandResponse> => {
    try {
      // Store tutorial phrases in localStorage
      localStorage.setItem('completed-tutorials', JSON.stringify(allTutorialPhraseNames));

      navigate({
        activityKey: ActivityType.NORMAL,
        contentKey: null,
        groupKey: null
      })
      return Promise.resolve({
        status: 200,
        message: 'Tutorial completion status saved successfully',
      });
    } catch (error: unknown) {
      logger.error('Complete command error:', error);
      return Promise.resolve({
        status: 500,
        message: 'Failed to save tutorial completion status',
      });
    }
  },
};
