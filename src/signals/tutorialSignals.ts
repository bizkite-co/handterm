import { signal } from '@preact/signals-react';
import { Tutorial } from '../types/Types';

export const tutorialSignal = signal<Tutorial | null>(null);
export const completedTutorialsSignal = signal<string[]>([]);
export const setNextTutorial = (tutorial: Tutorial | null) => {
  tutorialSignal.value = tutorial;
};
export const resetCompletedTutorials = () => {
  completedTutorialsSignal.value = [];
};
export const getNextTutorial = () => {
  return tutorialSignal.value;
};
export const setCompletedTutorial = (phrase: string) => {
  completedTutorialsSignal.value = [...completedTutorialsSignal.value, phrase];
};
export const getIncompleteTutorialsInGroup = (groupKey: string) => {
  return [];
};
