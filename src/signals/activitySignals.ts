import { signal } from "@preact/signals-react";
import { ActivityType } from '../types/Types';
import { GamePhrase } from '../utils/GamePhrases';

export const activitySignal = signal<ActivityType>(ActivityType.NORMAL);
export const startGameSignal = signal<string | undefined>(undefined);
export const gamePhraseSignal = signal<GamePhrase | null>(null);
export const gameInitSignal = signal<boolean>(false);

export const setActivity = (activity: ActivityType, tutorialGroup?: string) => {
  activitySignal.value = activity;
};

export const initializeGame = (tutorialGroup?: string) => {
  activitySignal.value = ActivityType.GAME;

  gameInitSignal.value = true;
};

export const setGamePhrase = (phrase: GamePhrase | null) => {
  gamePhraseSignal.value = phrase;
};
