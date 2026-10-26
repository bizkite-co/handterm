import { navigate } from "src/utils/navigationUtils";
import { type ICommand, type ICommandContext, type ICommandResponse } from "../contexts/CommandContext.js";
import { ActivityType } from '@handterm/types';
import type { ParsedCommand } from "../types/Types";
import {
  getNextGamePhrase,
  initializeGame,
  setGamePhrase,
} from "src/signals/gameSignals.js";
import { createLogger } from "../utils/Logger.js";

const logger = createLogger({ prefix: "PlayCommand" });

export const PlayCommand: ICommand = {
  name: 'play',
  description: 'Resume the game',
  execute: async (
    _context: ICommandContext,
    _parsedCommand: ParsedCommand
  ): Promise<ICommandResponse> => {
    try {
      const nextGamePhrase = getNextGamePhrase();
      setGamePhrase(nextGamePhrase);
      initializeGame();
      navigate({
        activityKey: ActivityType.GAME,
        contentKey: nextGamePhrase?.key ?? null,
        groupKey: nextGamePhrase?.tutorialGroup ?? null
      });
      return {
        status: 200,
        message: nextGamePhrase != null
          ? `Playing: ${nextGamePhrase.value}`
          : 'No game phrases remaining.',
      };
    } catch (error: unknown) {
      logger.error('Play command error:', error);
      return {
        status: 500,
        message: 'Failed to start the game',
      };
    }
  },
};