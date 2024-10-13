import { computed, signal } from '@preact/signals-react'
import { ActionType } from '../game/types/ActionTypes';
import { GamePhrase } from '../utils/GamePhrases';
import { SpritePosition } from 'src/game/types/Position';

const completedTutorialsKey = "completed-tutorials";

export const heroActionSignal = signal<ActionType>('Idle');
export const heroPositionSignal = signal<SpritePosition>({ leftX: 125, topY: 29 })
export const zombie4ActionSignal = signal<ActionType>('Walk');
export const zombie4PostionSignal = signal<SpritePosition>({ leftX: -70, topY: 0 })
export const gameLevelSignal = signal<number>(1);

export const completedTutorialsSignal = signal<Set<string>>(new Set());

// Function to load initial state
const loadInitialState = () => {
  const storedTutorials = localStorage.getItem(completedTutorialsKey);
  if (storedTutorials) {
    completedTutorialsSignal.value = new Set(JSON.parse(storedTutorials));
  }
};

// Load initial state
loadInitialState();

// Function to add a completed tutorial
export const setCompletedTutorial = (achievementId: string) => {
  completedTutorialsSignal.value = new Set(completedTutorialsSignal.value).add(achievementId);
  persistToLocalStorage();
};

// Function to reset completed tutorials
export const resetCompletedTutorials = () => {
  completedTutorialsSignal.value = new Set();
  persistToLocalStorage();
};

// Helper function to persist to localStorage
const persistToLocalStorage = () => {
  queueMicrotask(() => {
    localStorage.setItem(completedTutorialsKey, JSON.stringify([...completedTutorialsSignal.value]));
  });
};

export const setHeroAction = (action: ActionType) => {
  heroActionSignal.value = action;
};

export const setZombie4Action = (action: ActionType) => {
  zombie4ActionSignal.value = action;
};

export const setGameLevel = (level: number) => {
  gameLevelSignal.value = level;
};
