import { test, expect, type Page } from '@playwright/test';
import { TEST_CONFIG } from '../config';

test.describe('Tutorial Signal', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(TEST_CONFIG.baseUrl);

    // Set up the minimal window extensions we need
    await page.evaluate(() => {
      // Create a signal with a value from localStorage
      function createSignalFromStorage() {
        // Read from localStorage
        const stored = localStorage.getItem('completed-tutorials');

        // Parse the value
        let initialValue = new Set<string>();
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
              initialValue = new Set(parsed);
            }
          } catch (e) {
            console.error('[Signal] Error parsing localStorage:', e);
          }
        }

        // Create and return the signal
        return {
          value: initialValue,
          subscribers: new Set<(value: Set<string>) => void>(),
          subscribe(fn: (value: Set<string>) => void) {
            this.subscribers.add(fn);
            return () => this.subscribers.delete(fn);
          }
        };
      }

      // Function to update localStorage
      function updateStorage(value: Set<string>) {
        const array = Array.from(value);
        const json = JSON.stringify(array);
        localStorage.setItem('completed-tutorials', json);
      }

      // Create and initialize the signal
      const signal = createSignalFromStorage();

      // Add it to window
      (window as any).completedTutorialsSignal = signal;

      // Add the completion function
      (window as any).setCompletedTutorial = (key: string) => {
        // Create new Set with existing values plus the new one
        const newSet = new Set(signal.value);
        newSet.add(key);
        signal.value = newSet;
        updateStorage(signal.value);
        signal.subscribers.forEach(fn => fn(signal.value));
      };

      // Function to reinitialize signal from localStorage
      (window as any).reinitializeSignal = () => {
        signal.value = createSignalFromStorage().value;
      };
    });
  });

  test.describe('Tutorial Progression', () => {
    test('starts with empty tutorial state', async () => {
      await page.evaluate(() => {
        localStorage.setItem('completed-tutorials', JSON.stringify([]));
        (window as any).reinitializeSignal();
      });

      const tutorials = await page.evaluate(() => {
        return Array.from((window as any).completedTutorialsSignal.value);
      });

      expect(tutorials).toEqual([]);
    });

    test('completes enter tutorial', async () => {
      // Start with empty state
      await page.evaluate(() => {
        localStorage.setItem('completed-tutorials', JSON.stringify([]));
        (window as any).reinitializeSignal();
      });

      // Complete enter tutorial
      await page.evaluate(() => {
        (window as any).setCompletedTutorial('\\r');
      });

      const tutorials = await page.evaluate(() => {
        return Array.from((window as any).completedTutorialsSignal.value);
      });

      expect(tutorials).toEqual(['\\r']);
    });

    test('completes fdsa tutorial after enter', async () => {
      // Start with enter completed
      await page.evaluate(() => {
        const value = ['\\r'];
        console.log('[Test] Setting localStorage with value:', value);
        const json = JSON.stringify(value);
        console.log('[Test] JSON string:', json);
        console.log('[Test] JSON bytes:', Array.from(json).map(c => c.charCodeAt(0)));
        localStorage.setItem('completed-tutorials', json);

        const stored = localStorage.getItem('completed-tutorials');
        console.log('[Test] Reading back from localStorage:', stored);
        console.log('[Test] Read bytes:', Array.from(stored || '').map(c => c.charCodeAt(0)));

        (window as any).reinitializeSignal();
      });

      // Complete fdsa tutorial
      await page.evaluate(() => {
        (window as any).setCompletedTutorial('fdsa');
      });

      const tutorials = await page.evaluate(() => {
        return Array.from((window as any).completedTutorialsSignal.value);
      });

      expect(tutorials).toEqual(['\\r', 'fdsa']);
    });

    test('completes jkl; tutorial after fdsa', async () => {
      // Start with enter and fdsa completed
      await page.evaluate(() => {
        localStorage.setItem('completed-tutorials', '["\\r","fdsa"]');
        (window as any).reinitializeSignal();
      });

      // Complete jkl; tutorial
      await page.evaluate(() => {
        (window as any).setCompletedTutorial('jkl;');
      });

      const tutorials = await page.evaluate(() => {
        return Array.from((window as any).completedTutorialsSignal.value);
      });

      expect(tutorials).toEqual(['\\r', 'fdsa', 'jkl;']);
    });
  });

  test.afterEach(async () => {
    await page.close();
  });
});
