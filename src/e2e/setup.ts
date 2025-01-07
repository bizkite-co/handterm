import { test as playwrightTest } from '@playwright/test';
import type { GamePhrase, ActivityType } from '../types/Types';

declare global {
  interface Window {
    testName: string;
  }
}

// Initialize localStorage and window methods for all e2e tests
export const setupPlaywrightTests = (): void => {
  playwrightTest.beforeEach(async ({ context }, _testInfo) => {
    await context.addInitScript((title: string) => {
      window.testName = title;
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

      // Initialize tutorial state based on test name
      const testName = window.testName;
      if (testName.includes('should handle \\r')) {
        window.localStorage.setItem('completed-tutorials', JSON.stringify([]));
      } else if (testName.includes('should handle fdsa\\r')) {
        window.localStorage.setItem('completed-tutorials', JSON.stringify(['\\r']));
      } else if (testName.includes('should handle jkl;\\r')) {
        window.localStorage.setItem('completed-tutorials', JSON.stringify(['\\r', 'fdsa']));
      }
      window.localStorage.setItem('tutorial-state', JSON.stringify({ currentStep: 0 }));

      // Initialize window methods
      if (typeof window.setActivity === 'undefined') {
        window.setActivity = (_activity: ActivityType) => {};
      }
      if (typeof window.setNextTutorial === 'undefined') {
        window.setNextTutorial = (_tutorial: GamePhrase | null) => {};
      }
    });
  });
};
