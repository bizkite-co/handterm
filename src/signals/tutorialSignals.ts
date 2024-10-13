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

export const updateTutorial = () => {
  // get next tutoral that is not in completed tutorials.
  const nextTutorial = Tutorials
    .find(t => !completedTutorialsSignal.value.has(t.phrase.join('')));
  if(nextTutorial){
    console.log("Next tutorial:", nextTutorial);
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
  return tutorialSignal.value;
};

export const unlockTutorial = (command: string): boolean => {
  const nextTutorial = tutorialSignal.value;
  if (!nextTutorial) return false;
  
  const normalizedCommand = command === '\r' ? 'Return (ENTER)' : command;
  if (nextTutorial.phrase.join('') === normalizedCommand) {
    console.log("Matched:", normalizedCommand);
    setCompletedTutorial(normalizedCommand);
    return true;
  }
  console.log("unmatched:", normalizedCommand);
  return false;
};

export const isTutorialCompleted = (tutorialId: string) => completedTutorialsSignal.value.has(tutorialId);