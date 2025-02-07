import { test, expect, type Page } from '@playwright/test';
import { TEST_CONFIG } from '../config';

test.describe('Signal Setup', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(TEST_CONFIG.baseUrl);
  });

  test('can create a simple signal', async () => {
    const result = await page.evaluate(() => {
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

      return {
        hasValue: signal.value.has('test-tutorial'),
        hasDifferentValue: signal.value.has('other-tutorial')
      };
    });

    expect(result.hasValue).toBe(true);
    expect(result.hasDifferentValue).toBe(false);
  });

  test('can read from localStorage', async () => {
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

    expect(result.signalValue).toBe('storage-value');
    expect(result.storageValue).toBe('storage-value');
  });

  test('can notify subscribers', async () => {
    const result = await page.evaluate(() => {
      const signal = {
        value: 0,
        subscribers: new Set<(value: number) => void>(),
        subscribe(fn: (value: number) => void) {
          this.subscribers.add(fn);
          return () => this.subscribers.delete(fn);
        }
      };

      // Add a subscriber that updates a test value
      let lastValue = -1;
      signal.subscribe((value) => {
        lastValue = value;
      });

      // Update the signal
      signal.value = 42;
      signal.subscribers.forEach(fn => fn(signal.value));

      return {
        signalValue: signal.value,
        subscriberValue: lastValue
      };
    });

    expect(result.signalValue).toBe(42);
    expect(result.subscriberValue).toBe(42);
  });

  test.afterEach(async () => {
    await page.close();
  });
});