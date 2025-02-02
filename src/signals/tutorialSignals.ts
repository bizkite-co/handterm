// src/signals/tutorialSignals.ts
import { computed, signal } from "@preact/signals-react";

import { ActivityType } from '@handterm/types';
import type { GamePhrase } from "@handterm/types/Types";
import { Phrases } from "@handterm/types/Types";
import { createLogger } from "src/utils/Logger";

import { createPersistentSignal } from "../utils/signalPersistence";
import { activitySignal } from "./appSignals";

const logger = createLogger({ prefix: 'tutorialSignals' });

const completedTutorialsKey = "completed-tutorials";

const { signal: completedTutorialsSignal, update: updateCompletedTutorials } = createPersistentSignal({
  key: completedTutorialsKey,
  signal: signal<Set<string>>(new Set()),
  serialize: (value) => JSON.stringify([...value]),
  deserialize: (value) => new Set(JSON.parse(value) as string[]),
});

export const tutorialSignal = signal<GamePhrase | null>(null);

export { completedTutorialsSignal };

/**
 * Gets the next uncompleted tutorial
 * @returns The next Tutorial or null if all are completed
 */
export const getNextTutorial = (): GamePhrase | null => {
  const nextTutorial = Phrases
    .filter(t => t.displayAs === "Tutorial")
    .find(t => !completedTutorialsSignal.value.has(t.key));
  logger.debug('Getting next tutorial:', { nextTutorial, completedTutorials: [...completedTutorialsSignal.value] });
  return nextTutorial ?? null;
};

/**
 * Sets the next tutorial
 * @param nextTutorial - The tutorial to set as next
 */
export const setNextTutorial = (nextTutorial: GamePhrase | null): void => {
  logger.debug('Setting next tutorial:', nextTutorial);
  tutorialSignal.value = nextTutorial;
};

// Load initial state
const loadInitialState = () => {
  try {
    logger.debug('Loading initial tutorial state');
    const storedTutorials = localStorage.getItem(completedTutorialsKey);

    if (storedTutorials != null) {
      logger.debug('Found stored tutorials:', storedTutorials);
      completedTutorialsSignal.value = new Set(JSON.parse(storedTutorials) as string[]);
    } else {
      logger.debug('No stored tutorials found - initializing new state');
      completedTutorialsSignal.value = new Set();
    }

    const nextTutorial = getNextTutorial();
    logger.debug('Initial tutorial state:', {
      nextTutorial,
      completedTutorials: [...completedTutorialsSignal.value]
    });

    if (nextTutorial != null) {
      setNextTutorial(nextTutorial);
    }
  } catch (error) {
    logger.error('Error loading tutorial state:', error);
    // Reset state on error
    resetCompletedTutorials();
  }
};

// Delay initialization to ensure localStorage is ready
setTimeout(loadInitialState, 100);

// Computed signals
export const completedTutorialsArray = computed(() => [...completedTutorialsSignal.value]);

// Exported functions
/**
 * Marks a tutorial as completed and sets the next tutorial
 * @param tutorialId - The ID of the completed tutorial
 */
export const setCompletedTutorial = (tutorialKey: string): void => {
  logger.debug('Setting completed tutorial:', { tutorialKey, currentTutorial: tutorialSignal.value });
  updateCompletedTutorials(prev => new Set(prev).add(tutorialKey));
  // After marking a tutorial as complete, get and set the next one
  const nextTutorial = getNextTutorial();
  logger.debug('Next tutorial after completion:', nextTutorial);
  setNextTutorial(nextTutorial);
};

/**
 * Resets all completed tutorials and sets the first tutorial
 */
export const resetCompletedTutorials = (): void => {
  logger.debug('Resetting completed tutorials');
  updateCompletedTutorials(new Set());
  const nextTutorial = getNextTutorial();
  logger.debug('First tutorial after reset:', nextTutorial);
  setNextTutorial(nextTutorial);
};

/**
 * Marks all tutorials as completed
 */
export const completeAllTutorials = (): void => {
  logger.debug('Completing all tutorials');
  const allTutorialKeys = Phrases
    .filter(t => t.displayAs === "Tutorial")
    .map(t => t.key);
  updateCompletedTutorials(new Set(allTutorialKeys));
  setNextTutorial(null);
  activitySignal.value = ActivityType.NORMAL;
};
