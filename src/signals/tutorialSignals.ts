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

export const updateTutorial = ():boolean => {
  // get next tutoral that is not in completed tutorials.
  const nextTutorial = Tutorials
    .find(t => !completedTutorialsSignal.value.has(t.phrase.join('')));
  if(nextTutorial){
    tutorialSignal.value = nextTutorial;
    return true;
  }
  else{
    tutorialSignal.value = null;
    return false;
  }
};

// Load initial state
const loadInitialState = () => {
  const storedTutorials = localStorage.getItem(completedTutorialsKey);
  if (storedTutorials) {
    completedTutorialsSignal.value = new Set(JSON.parse(storedTutorials));
  }
  updateTutorial();
};

loadInitialState();

// Computed signals
export const completedTutorialsArray = computed(() => [...completedTutorialsSignal.value]);

// Exported functions
export const setCompletedTutorial = (tutorialId: string) => {
  updateCompletedTutorials(prev => new Set(prev).add(tutorialId));
  updateTutorial();
};

export const resetCompletedTutorials = () => {
  updateCompletedTutorials(new Set());
  updateTutorial();
};

export const getNextTutorial = (): Tutorial | null => {
  const nextTutorial = Tutorials
    .find(t => !completedTutorialsSignal.value.has(t.phrase.join('')));
  return nextTutorial ?? null;
};

export const unlockTutorial = (command: string): boolean => {
  const currentTutorial = tutorialSignal.value;
  if (!currentTutorial) return false;
  
  const normalizedCommand = command === '\r' ? 'Return (ENTER)' : command;
  if (currentTutorial.phrase.join('') === normalizedCommand) {
    setCompletedTutorial(normalizedCommand);
    updateTutorial();
    console.log(tutorialSignal.value);
    return true;
  }
  return false;
};

export const isTutorialCompleted = (tutorialId: string) => completedTutorialsSignal.value.has(tutorialId);