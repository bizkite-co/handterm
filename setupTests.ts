import { vi, beforeAll } from 'vitest';
import { type ActivityType, StorageKeys } from '@handterm/types';
import type { GamePhrase } from './src/types/Types';

declare global {
  interface Window {
    setNextTutorial: (tutorial: GamePhrase | null) => void;
    setActivity: (activity: ActivityType) => void;
    ActivityType: typeof ActivityType;
  }
}

// Initialize localStorage before any tests run
beforeAll(() => {
  if (typeof window.localStorage === 'undefined') {
    const store: Record<string, string | undefined> = {};
    window.localStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { store[key] = undefined; },
      clear: () => { Object.keys(store).forEach(key => { store[key] = undefined; }); },
      length: Object.keys(store).length,
      key: (index: number) => Object.keys(store)[index] ?? null
    };
  }

  // Initialize tutorial state
  window.localStorage.setItem(StorageKeys.tutorialState, JSON.stringify({ currentStep: 0 }));

  // Initialize window methods
  if (typeof window.setActivity === 'undefined') {
    window.setActivity = vi.fn();
  }
  if (typeof window.setNextTutorial === 'undefined') {
    window.setNextTutorial = vi.fn();
  }
});

// Suppress console warnings by mocking console methods
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
