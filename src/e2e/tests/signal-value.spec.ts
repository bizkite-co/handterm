import { test, expect, type Page } from '@playwright/test';
import { TEST_CONFIG } from '../config';

test.describe('Signal Value', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(TEST_CONFIG.baseUrl);
    await page.waitForLoadState('domcontentloaded');
    // Wait for app to mount and expose signals on window
    await page.waitForFunction(
      () => typeof (window as any).completedTutorialsSignal !== 'undefined',
      null,
      { timeout: TEST_CONFIG.timeout.long }
    );
  });

  test('completedTutorialsSignal.value is a Set', async () => {
    const isSet = await page.evaluate(() => {
      return window.completedTutorialsSignal.value instanceof Set;
    });
    expect(isSet).toBe(true);
  });

  test('completedTutorialsSignal.value is empty on initialization', async () => {
    const size = await page.evaluate(() => {
      return window.completedTutorialsSignal.value.size;
    });
    expect(size).toBe(0);
  });

  test.afterEach(async () => {
    await page.close();
  });
});