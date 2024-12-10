// src/signals/tutorialSignals.ts
import { computed, signal } from "@preact/signals-react";
import { createPersistentSignal } from "../utils/signalPersistence";
import { Tutorial, Tutorials } from "src/types/Types";
import { createLogger } from "src/utils/Logger";

const logger = createLogger({ prefix: 'tutorialSignals' });

const completedTutorialsKey = "completed-tutorials";

const { signal: completedTutorialsSignal, update: updateCompletedTutorials } = createPersistentSignal({
  key: completedTutorialsKey,
  signal: signal<Set<string>>(new Set()),
  serialize: (value) => JSON.stringify([...value]),
  deserialize: (value) => new Set(JSON.parse(value)),
});

export { completedTutorialsSignal };

export const tutorialSignal = signal<Tutorial | null>(null);

export const getNextTutorial = (): Tutorial | null => {
  const nextTutorial = Tutorials
    .find(t => !completedTutorialsSignal.value.has(t.phrase));
  logger.debug('Getting next tutorial:', { nextTutorial, completedTutorials: [...completedTutorialsSignal.value] });
  return nextTutorial ?? null;
};

export const setNextTutorial = (nextTutorial: Tutorial | null) => {
  logger.debug('Setting next tutorial:', nextTutorial);
  tutorialSignal.value = nextTutorial;
};

// Load initial state
const loadInitialState = () => {
  const storedTutorials = localStorage.getItem(completedTutorialsKey);
  if (storedTutorials) {
    logger.debug('Loading stored tutorials:', storedTutorials);
    completedTutorialsSignal.value = new Set(JSON.parse(storedTutorials));
  }
  const nextTutorial = getNextTutorial();
  logger.debug('Initial tutorial:', nextTutorial);
  setNextTutorial(nextTutorial);
};

loadInitialState();

// Computed signals
export const completedTutorialsArray = computed(() => [...completedTutorialsSignal.value]);

// Exported functions
export const setCompletedTutorial = (tutorialId: string) => {
  logger.debug('Setting completed tutorial:', { tutorialId, currentTutorial: tutorialSignal.value });
  updateCompletedTutorials(prev => new Set(prev).add(tutorialId));
  // After marking a tutorial as complete, get and set the next one
  const nextTutorial = getNextTutorial();
  logger.debug('Next tutorial after completion:', nextTutorial);
  setNextTutorial(nextTutorial);
};

export const resetCompletedTutorials = () => {
  logger.debug('Resetting completed tutorials');
  updateCompletedTutorials(new Set());
  const nextTutorial = getNextTutorial();
  logger.debug('First tutorial after reset:', nextTutorial);
  setNextTutorial(nextTutorial);
};
