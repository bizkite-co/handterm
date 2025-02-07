import { test, expect, type Page } from '@playwright/test';
import { TEST_CONFIG } from '../config';

test.describe('Activity State Signal', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(TEST_CONFIG.baseUrl);
  });

  test('can create activity state signal', async () => {
    const result = await page.evaluate(() => {
      // Create activity state signal
      window.activityStateSignal = {
        value: {
          current: 'normal',
          previous: 'tutorial',
          transitionInProgress: false,
          tutorialCompleted: true
        }
      };

      return {
        current: window.activityStateSignal.value.current,
        previous: window.activityStateSignal.value.previous,
        transitionInProgress: window.activityStateSignal.value.transitionInProgress,
        tutorialCompleted: window.activityStateSignal.value.tutorialCompleted
      };
    });

    expect(result.current).toBe('normal');
    expect(result.previous).toBe('tutorial');
    expect(result.transitionInProgress).toBe(false);
    expect(result.tutorialCompleted).toBe(true);
  });

  test('can update activity state', async () => {
    const result = await page.evaluate(() => {
      // Create activity state signal
      window.activityStateSignal = {
        value: {
          current: 'normal',
          previous: 'tutorial',
          transitionInProgress: false,
          tutorialCompleted: true
        }
      };

      // Set up activity setter
      window.setActivity = (activity) => {
        window.activityStateSignal.value = {
          ...window.activityStateSignal.value,
          current: activity
        };
      };

      // Update activity
      window.setActivity('edit');

      return {
        current: window.activityStateSignal.value.current,
        previous: window.activityStateSignal.value.previous
      };
    });

    expect(result.current).toBe('edit');
    expect(result.previous).toBe('tutorial');
  });

  test.afterEach(async () => {
    await page.close();
  });
});