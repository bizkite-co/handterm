// @ts-nocheck
import { test, expect, type Page } from '@playwright/test';
import {
  activitySignal,
  ActivityType,
  setActivity,
} from 'src/signals/appSignals';
import {
  tutorialSignal,
  setCompletedTutorial,
  resetCompletedTutorials,
} from 'src/signals/tutorialSignals';
import { TEST_CONFIG } from './config';

test.describe('Signal Initialization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_CONFIG.baseUrl);
  });

  test('should correctly initialize and use tutorialSignal', async ({
    page,
  }) => {
    // Check initial value
    let tutorialValue = await page.evaluate(() => tutorialSignal.value);
    expect(tutorialValue).toBe(null);

    // Set a value and check
    await page.evaluate(() => setCompletedTutorial('testTutorial'));
    tutorialValue = await page.evaluate(() => tutorialSignal.value);
    expect(tutorialValue).not.toBe(null);

    // Reset and check again
    await page.evaluate(() => resetCompletedTutorials());
    tutorialValue = await page.evaluate(() => tutorialSignal.value);
    expect(tutorialValue).toBe(null);
  });
});