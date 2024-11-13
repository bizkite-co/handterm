// src/signals/tutorialSignals.ts
import { computed, signal } from "@preact/signals-react";
import { createPersistentSignal } from "../utils/signalPersistence";
import { Tutorial, Tutorials } from "src/types/Types";

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
  return nextTutorial ?? null;
};

export const setNextTutorial = (nextTutorial: Tutorial | null) => {
  // get next tutoral that is not in completed tutorials.
  // use getTutorialSignal to return the result.
  tutorialSignal.value = nextTutorial;
};

// Load initial state
const loadInitialState = () => {
  const storedTutorials = localStorage.getItem(completedTutorialsKey);
  if (storedTutorials) {
    completedTutorialsSignal.value = new Set(JSON.parse(storedTutorials));
  }
  setNextTutorial(getNextTutorial());
};

loadInitialState();

// Computed signals
export const completedTutorialsArray = computed(() => [...completedTutorialsSignal.value]);

// Exported functions
export const setCompletedTutorial = (tutorialId: string) => {
  updateCompletedTutorials(prev => new Set(prev).add(tutorialId));
};

export const resetCompletedTutorials = () => {
  updateCompletedTutorials(new Set());
  setNextTutorial(getNextTutorial());
};


