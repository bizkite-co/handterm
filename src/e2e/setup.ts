import { test } from '@playwright/test';
import { type ActivityType } from '@handterm/types';
import type { GamePhrase } from '../types/Types';

declare global {
  interface Window {
    setNextTutorial: (tutorial: GamePhrase | null) => void;
    setActivity: (activity: ActivityType) => void;
    ActivityType: typeof ActivityType;
  }
}

// Initialize localStorage and window methods for all tests
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Initialize localStorage
    if (typeof window.localStorage === 'undefined') {
      const store: Record<string, string | undefined> = {};
      window.localStorage = {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { store[key] = undefined; },
        clear: () => { Object.keys(store).forEach(key => { store[key] = undefined; }); },
        length: Object.keys(store).length,
        key: (index: number) => Object.keys(store)[index] || null
      };
    }

    // Initialize tutorial state
    window.localStorage.setItem('tutorial-state', JSON.stringify({ currentStep: 0 }));

    // Initialize window methods
    if (typeof window.setActivity === 'undefined') {
      window.setActivity = () => { };
    }
    if (typeof window.setNextTutorial === 'undefined') {
      window.setNextTutorial = () => { };
    }
  });
});
