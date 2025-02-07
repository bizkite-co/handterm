import { test, expect, type Page } from '@playwright/test';
import { TEST_CONFIG } from '../config';

test.describe('Setup Validation', () => {
  test.describe('Basic Page Loading and Element Presence', () => {
    let page: Page;

    test.beforeAll(async ({ browser }) => {
      page = await browser.newPage();
      await page.goto(TEST_CONFIG.baseUrl);
    });

    test('Page loads successfully', async () => {
      expect(page.url()).toContain(TEST_CONFIG.baseUrl);
    });

    test('#handterm-wrapper element is present', async () => {
      const wrapper = await page.$('#handterm-wrapper');
      expect(wrapper).not.toBeNull();
    });
  });

  test.describe('Window Extensions', () => {
    test('window.completedTutorialsSignal is defined', async ({ page }) => {
      const isDefined = await page.evaluate(() => typeof window.completedTutorialsSignal !== 'undefined');
      expect(isDefined).toBe(true);
    });
  });

    test.describe('LocalStorage Consistency', () => {
        let page: Page;
        const TEST_KEY = 'playwright-test-key';
        const TEST_VALUE = 'test-value-' + Date.now();

        test.beforeAll(async ({browser}) => {
            page = await browser.newPage();
            await page.goto(TEST_CONFIG.baseUrl);
        })

        test('localStorage is consistent between test and app context', async () => {
            // Write from test context
          await page.evaluate(({key, value}) => {
            localStorage.setItem(key, value);
          }, { key: TEST_KEY, value: TEST_VALUE });

          // Read from app context
          const appRead = await page.evaluate(({key}) => {
            return localStorage.getItem(key);
          }, {key: TEST_KEY});

          expect(appRead).toBe(TEST_VALUE);

          // Write from app context
          const appValue = 'app-value-' + Date.now();
          await page.evaluate(({key, value}) => {
            window.localStorage.setItem(key, value);
          }, {key: TEST_KEY, value: appValue});

          // Read from test context
          const testRead = await page.evaluate(({key}) => {
            return localStorage.getItem(key);
          }, {key: TEST_KEY});

          expect(testRead).toBe(appValue);

          // Clean up
          await page.evaluate(({key}) => {
            localStorage.removeItem(key)
          }, {key: TEST_KEY});

        });
    });
});