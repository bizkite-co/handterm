import { signal } from "@preact/signals-react";
import { ActivityType, Tutorial } from '../types/Types';
import { GamePhrase } from '../utils/GamePhrases';

export const activitySignal = signal<ActivityType>(ActivityType.NORMAL);
export const tutorialSignal = signal<Tutorial | null>(null)
export const startGameSignal = signal<string | undefined>(undefined);
export const tutorialGroupSignal = signal<string | undefined>(undefined);
export const gamePhraseSignal = signal<GamePhrase | null>(null);
export const gameInitSignal = signal<boolean>(false);

export const setActivity = (activity: ActivityType, tutorialGroup?: string) => {
  activitySignal.value = activity;
  tutorialGroupSignal.value = tutorialGroup;
  if (activity === ActivityType.GAME) {
    tutorialGroupSignal.value = tutorialGroup;
  }
};

export const setTutorial = (currentTutorial: Tutorial | null) => {
  tutorialSignal.value = currentTutorial;
}

export const initializeGame = (tutorialGroup?: string) => {
  activitySignal.value = ActivityType.GAME;
  tutorialGroupSignal.value = tutorialGroup;
  gameInitSignal.value = true;
};

export const setGamePhrase = (phrase: GamePhrase | null) => {
  gamePhraseSignal.value = phrase;
};
