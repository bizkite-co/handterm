import { signal } from "@preact/signals-react";
import { ActivityType } from '../types/Types';

export const gameActivitySignal = signal<ActivityType>(ActivityType.NORMAL);
export const startGameSignal = signal<string | undefined>(undefined);

export const signalGameStart = (tutorialGroup?: string) => {
  gameActivitySignal.value = ActivityType.GAME;
  startGameSignal.value = tutorialGroup;
};