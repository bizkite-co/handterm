import { test, expect, type Page } from '@playwright/test';
import { TEST_CONFIG } from '../config';

test.describe('Tutorial Signal', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(TEST_CONFIG.baseUrl);

    // Set up the minimal window extensions we need
    await page.evaluate(() => {
      // Initialize signal with any existing localStorage data
      const stored = localStorage.getItem('completed-tutorials');
      const initialValue = stored ? new Set(JSON.parse(stored)) : new Set<string>();

      // Create the signal
      const signal = {
        value: initialValue,
        subscribers: new Set<(value: Set<string>) => void>(),
        subscribe(fn: (value: Set<string>) => void) {
          this.subscribers.add(fn);
          return () => this.subscribers.delete(fn);
        }
      };

      // Add it to window
      (window as any).completedTutorialsSignal = signal;

      // Add the completion function
      (window as any).setCompletedTutorial = (key: string) => {
        console.log('[Test] Completing tutorial:', key);
        signal.value.add(key);
        // Update localStorage to match signal
        localStorage.setItem('completed-tutorials', JSON.stringify(Array.from(signal.value)));
        signal.subscribers.forEach(fn => fn(signal.value));
      };
    });
  });

  test('signal reflects empty localStorage state', async () => {
    // Set up empty localStorage state
    await page.evaluate(() => {
      localStorage.setItem('completed-tutorials', '[]');
    });

    // Check signal state
    const result = await page.evaluate(() => {
      return Array.from(window.completedTutorialsSignal.value);
    });

    expect(result).toEqual([]);
  });

  test('signal reflects pre-existing completed tutorial', async () => {
    // Set up localStorage with a completed tutorial
    await page.evaluate(() => {
      localStorage.setItem('completed-tutorials', '["\\r"]');
    });

    // Check signal state
    const result = await page.evaluate(() => {
      return {
        hasEnterTutorial: window.completedTutorialsSignal.value.has('\\r'),
        allTutorials: Array.from(window.completedTutorialsSignal.value)
      };
    });

    expect(result.hasEnterTutorial).toBe(true);
    expect(result.allTutorials).toEqual(['\\r']);
  });

  test('can mark additional tutorial as completed', async () => {
    // Set up localStorage with one completed tutorial
    await page.evaluate(() => {
      localStorage.setItem('completed-tutorials', '["\\r"]');
    });

    // Mark another tutorial as completed
    await page.evaluate(() => {
      window.setCompletedTutorial('fdsa');
    });

    // Check final state
    const result = await page.evaluate(() => {
      return Array.from(window.completedTutorialsSignal.value);
    });

    expect(result).toContain('\\r');
    expect(result).toContain('fdsa');
  });

  test.afterEach(async () => {
    await page.close();
  });
});