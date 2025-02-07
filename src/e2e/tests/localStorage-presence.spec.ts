import { test, expect, type Page } from '@playwright/test';
import { TEST_CONFIG } from '../config';

test.describe('LocalStorage Presence', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(TEST_CONFIG.baseUrl);
  });

  test('can write and read localStorage in one step', async () => {
    const result = await page.evaluate(() => {
      // Write a value
      localStorage.setItem('test-key', 'test-value');

      // Read it back
      const value = localStorage.getItem('test-key');

      return value;
    });

    expect(result).toBe('test-value');
  });

  test('localStorage persists between evaluate calls', async () => {
    // First call: set the value
    await page.evaluate(() => {
      localStorage.setItem('persist-key', 'persist-value');
    });

    // Second call: read the value
    const result = await page.evaluate(() => {
      return localStorage.getItem('persist-key');
    });

    expect(result).toBe('persist-value');
  });

  test.afterEach(async () => {
    await page.close();
  });
});