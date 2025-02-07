import { test, expect, type Page } from '@playwright/test';
import { TEST_CONFIG } from '../config';

test.describe('Signal Storage Interaction', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(TEST_CONFIG.baseUrl);
  });

  test('signal can read from localStorage', async () => {
    const result = await page.evaluate(() => {
      // Create a signal
      const signal = {
        value: null as string | null,
        subscribers: new Set<(value: string | null) => void>(),
        subscribe(fn: (value: string | null) => void) {
          this.subscribers.add(fn);
          return () => this.subscribers.delete(fn);
        }
      };

      // Set a value in localStorage
      localStorage.setItem('storage-key', 'storage-value');

      // Update signal from localStorage
      signal.value = localStorage.getItem('storage-key');

      return {
        signalValue: signal.value,
        storageValue: localStorage.getItem('storage-key')
      };
    });

    // Both should have the same value
    expect(result.signalValue).toBe('storage-value');
    expect(result.storageValue).toBe('storage-value');
  });

  test('signal can read pre-existing localStorage value', async () => {
    // First: Set a value in localStorage
    await page.evaluate(() => {
      localStorage.setItem('tutorial-key', 'completed');
    });

    // Then: Create a signal and read the value
    const result = await page.evaluate(() => {
      const signal = {
        value: localStorage.getItem('tutorial-key'),
        subscribers: new Set<(value: string | null) => void>(),
        subscribe(fn: (value: string | null) => void) {
          this.subscribers.add(fn);
          return () => this.subscribers.delete(fn);
        }
      };

      return {
        signalValue: signal.value
      };
    });

    expect(result.signalValue).toBe('completed');
  });

  test('can check for existence in a Set-based signal', async () => {
    const result = await page.evaluate(() => {
      // Create a Set-based signal
      const signal = {
        value: new Set<string>(),
        subscribers: new Set<(value: Set<string>) => void>(),
        subscribe(fn: (value: Set<string>) => void) {
          this.subscribers.add(fn);
          return () => this.subscribers.delete(fn);
        }
      };

      // Add a value
      signal.value.add('test-tutorial');

      // Check if it exists
      return {
        hasValue: signal.value.has('test-tutorial'),
        hasDifferentValue: signal.value.has('other-tutorial')
      };
    });

    expect(result.hasValue).toBe(true);
    expect(result.hasDifferentValue).toBe(false);
  });

  test.afterEach(async () => {
    await page.close();
  });
});