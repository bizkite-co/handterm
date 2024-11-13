import { signal } from '@preact/signals-react';

export const tutorialSignal = signal(null);
export const completedTutorialsSignal = signal([]);
export const setNextTutorial = jest.fn();
export const resetCompletedTutorials = jest.fn();
export const getNextTutorial = jest.fn();
export const setCompletedTutorial = jest.fn();
export const getIncompleteTutorialsInGroup = jest.fn(() => []);
