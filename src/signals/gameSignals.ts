
// gameSignals.ts
import { signal } from "@preact/signals-react";

import { type ActionType, type GamePhrase, Phrases } from "@handterm/types";
import { createPersistentSignal } from "src/utils/signalPersistence";

export const startGameSignal = signal<string | undefined>(undefined);
export const gamePhraseSignal = signal<GamePhrase | null>(null);
export const gameInitSignal = signal<boolean>(false);
export const isInGameModeSignal = signal<boolean>(false);
export const currentGamePhraseSignal = signal<GamePhrase | null>(null);
export const gameLevelSignal = signal<number | null>(null);
export const heroActionSignal = signal<ActionType>('Idle');
export const zombie4ActionSignal = signal<ActionType>('Walk');

const completedGamePhrasesKey = 'completed-game-phrases';

export const setHeroAction = (action: ActionType): void => {
  heroActionSignal.value = action;
};

export const setZombie4Action = (action: ActionType): void => {
  zombie4ActionSignal.value = action;
};

export const setGameLevel = (level: number): void => {
  gameLevelSignal.value = level;
};

const { signal: completedGamePhrasesSignal, update: updateCompletedGamePhrases } = createPersistentSignal<Set<string>>({
  key: completedGamePhrasesKey,
  signal: signal<Set<string>>(new Set()),
  serialize: (value: Set<string>) => JSON.stringify([...value]),
  deserialize: (value: string) => new Set(JSON.parse(value) as string[]),
});

export { completedGamePhrasesSignal };

export const setCompletedGamePhrase = (gamePhraseId: string): void => {
  updateCompletedGamePhrases(prev => prev.add(gamePhraseId));
}

export const getIncompletePhrasesByTutorialGroup = (tutorialGroup: string): GamePhrase[] => {
  const gamePhrasesInGroup = Phrases.filter(p => p.tutorialGroup === tutorialGroup && p.displayAs === 'Game');
  const incompletePhrasesInGroup = gamePhrasesInGroup
    .filter(pig => !Array.from(completedGamePhrasesSignal.value).includes(pig.key))
  return incompletePhrasesInGroup;
}

export const getNextGamePhrase = (): GamePhrase | null => {
  const nextGamePhrase = Phrases
    .find(t => !completedGamePhrasesSignal.value.has(t.key));
  if (nextGamePhrase === undefined) {
    return null;
  }
  return nextGamePhrase;
};

export const initializeGame = (tutorialGroup?: string, contentKey?: string | null): void => {
  gameInitSignal.value = true;
  isInGameModeSignal.value = true;
  if (tutorialGroup != null) {
    const tutorialGroupGamePhrase = contentKey != null ? Phrases.filter(p => p.key === contentKey) :
      getIncompletePhrasesByTutorialGroup(tutorialGroup);
    if (tutorialGroupGamePhrase.length > 0) {
      gamePhraseSignal.value = tutorialGroupGamePhrase[0] ?? null;
    }
  }
};

export const setGamePhrase = (phrase: GamePhrase | null): void => {
  gamePhraseSignal.value = phrase;
};

// Load initial state
const loadInitialState = (): void => {
  const storedTutorials = localStorage.getItem(completedGamePhrasesKey);
  if (storedTutorials) {
    try {
      const parsedTutorials = JSON.parse(storedTutorials) as string[];
      completedGamePhrasesSignal.value = new Set(parsedTutorials);
    } catch (error) {
      console.error('Failed to parse stored tutorials:', error);
      completedGamePhrasesSignal.value = new Set();
    }
  }
  setGamePhrase(getNextGamePhrase());
};

loadInitialState();
