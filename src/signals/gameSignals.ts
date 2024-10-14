
// gameSignals.ts
import { signal, computed } from "@preact/signals-react";
import { setActivity } from "src/signals/appSignals";
import { ActionType } from "src/game/types/ActionTypes";
import GamePhrases from "src/utils/GamePhrases";
import { ActivityType, GamePhrase } from "src/types/Types";

export const startGameSignal = signal<string | undefined>(undefined);
export const gamePhraseSignal = signal<GamePhrase | null>(null);
export const gameInitSignal = signal<boolean>(false);
export const completedGamePhraseSignal = signal<Set<string>>(new Set());
export const currentGamePhraseSignal = signal<GamePhrase | null>(null);
export const gameLevelSignal = signal<number|null>(null);
export const heroActionSignal = signal<ActionType>('Idle');
export const zombie4ActionSignal = signal<ActionType>('Walk');


export const setHeroAction = (action: ActionType) => {
  heroActionSignal.value = action;
};

export const setZombie4Action = (action: ActionType) => {
  zombie4ActionSignal.value = action;
};

export const setGameLevel = (level: number) => {
  gameLevelSignal.value = level;
};

export const initializeGame = (tutorialGroup?: string) => {
  setActivity(ActivityType.GAME);
  gameInitSignal.value = true;
  if (tutorialGroup) {
    const tutorialGroupGamePhrase = GamePhrases.getIncompletePhrasesByTutorialGroup(tutorialGroup);
    if (tutorialGroupGamePhrase.length > 0) {
      gamePhraseSignal.value = tutorialGroupGamePhrase[0];
    }
  };
};

export const setGamePhrase = (phrase: GamePhrase | null) => {
  gamePhraseSignal.value = phrase;
};