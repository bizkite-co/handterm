import { test, expect, type Page } from '@playwright/test';
import { TEST_CONFIG } from '../config';

test.describe('Signal Presence', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(TEST_CONFIG.baseUrl);
  });

  test('can add and call a function on window in one step', async () => {
    const result = await page.evaluate(() => {
      console.log('[Browser] Adding testFunction');
      (window as any).testFunction = () => {
        console.log('[Browser] testFunction called');
        return "Hello from Playwright!";
      };
      console.log('[Browser] testFunction added');

      console.log('[Browser] About to call testFunction');
      const value = (window as any).testFunction();
      console.log('[Browser] testFunction returned:', value);
      return value;
    });

    expect(result).toBe("Hello from Playwright!");
  });

  test('can create and use a simple signal', async () => {
    const result = await page.evaluate(() => {
      // Create a signal
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

      // Return both values to verify the subscriber was called
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