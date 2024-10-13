
// gameSignals.ts
import { signal, computed } from "@preact/signals-react";
import { ActionType } from "src/game/types/ActionTypes";
import { GamePhrase } from "src/utils/GamePhrases";

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