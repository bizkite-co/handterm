// src/signals/tutorialSignals.ts
import { computed, signal } from "@preact/signals-react";

import { type Tutorial, Tutorials } from "src/types/Types";
import { createLogger } from "src/utils/Logger";

import { createPersistentSignal } from "../utils/signalPersistence";

const logger = createLogger({ prefix: 'tutorialSignals' });

const completedTutorialsKey = "completed-tutorials";

const { signal: completedTutorialsSignal, update: updateCompletedTutorials } = createPersistentSignal({
  key: completedTutorialsKey,
  signal: signal<Set<string>>(new Set()),
  serialize: (value) => JSON.stringify([...value]),
  deserialize: (value) => new Set(JSON.parse(value) as string[]),
});

export { completedTutorialsSignal };

export const tutorialSignal = signal<Tutorial | null>(null);

/**
 * Gets the next uncompleted tutorial
 * @returns The next Tutorial or null if all are completed
 */
export const getNextTutorial = (): Tutorial | null => {
  const nextTutorial = Tutorials
    .find(t => !completedTutorialsSignal.value.has(t.phrase));
  logger.debug('Getting next tutorial:', { nextTutorial, completedTutorials: [...completedTutorialsSignal.value] });
  return nextTutorial ?? null;
};

/**
 * Sets the next tutorial
 * @param nextTutorial - The tutorial to set as next
 */
export const setNextTutorial = (nextTutorial: Tutorial | null): void => {
  logger.debug('Setting next tutorial:', nextTutorial);
  tutorialSignal.value = nextTutorial;
};

// Load initial state
const loadInitialState = () => {
    if (storedTutorials != null) {
    logger.debug('Loading stored tutorials:', storedTutorials);
    completedTutorialsSignal.value = new Set(JSON.parse(storedTutorials) as string[]);
  }
  const nextTutorial = getNextTutorial();
  logger.debug('Initial tutorial:', nextTutorial);
  setNextTutorial(nextTutorial);
};

loadInitialState();

// Computed signals
export const completedTutorialsArray = computed(() => [...completedTutorialsSignal.value]);

// Exported functions
/**
 * Marks a tutorial as completed and sets the next tutorial
 * @param tutorialId - The ID of the completed tutorial
 */
export const setCompletedTutorial = (tutorialId: string): void => {
  logger.debug('Setting completed tutorial:', { tutorialId, currentTutorial: tutorialSignal.value });
  updateCompletedTutorials(prev => new Set(prev).add(tutorialId));
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
