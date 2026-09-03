import { navigate } from "src/utils/navigationUtils";
import { type ICommand, type ICommandContext, type ICommandResponse } from "../contexts/CommandContext.js";
import { ActivityType } from '@handterm/types';
import type { ParsedCommand } from "../types/Types";
import {
  getNextGamePhrase,
  initializeGame,
  resetCompletedGamePhrases,
  setGameLevel,
  setGamePhrase,
} from "src/signals/gameSignals.js";
import { createLogger } from "../utils/Logger.js";

const logger = createLogger({ prefix: "PlayCommand" });

export const PlayCommand: ICommand = {
  name: 'play',
  description: 'Resume the game',
  switches: {
    'r': 'Reset game progress and start from the beginning',
  },
  execute: async (
    _context: ICommandContext,
    parsedCommand: ParsedCommand
  ): Promise<ICommandResponse> => {
    try {
      if ('r' in parsedCommand.switches) {
        resetCompletedGamePhrases();
        setGameLevel(1);
      }
      const nextGamePhrase = getNextGamePhrase();
      setGamePhrase(nextGamePhrase);
      initializeGame();
      navigate({
        activityKey: ActivityType.GAME,
        contentKey: nextGamePhrase?.key ?? null,
        groupKey: nextGamePhrase?.tutorialGroup ?? null
      })
      const prefix = 'r' in parsedCommand.switches ? 'Restarted' : 'Playing';
      return Promise.resolve({
        status: 200,
        message: nextGamePhrase != null
          ? `${prefix}: ${nextGamePhrase.value}`
          : 'No game phrases remaining.',
      });
    } catch (error: unknown) {
      logger.error('Play command error:', error);
      return Promise.resolve({
        status: 500,
        message: 'Failed to start the game',
      });
    }
  },
};