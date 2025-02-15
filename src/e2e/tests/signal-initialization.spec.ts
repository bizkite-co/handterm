import { test, expect } from '@playwright/test';
import { ActivityType } from '@handterm/types';
import { initializeActivitySignal } from '../helpers/initializeSignals';

test.describe('Signal Initialization', () => {
  test('should initialize activity signal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await initializeActivitySignal(page);

    const signalState = await page.evaluate(() => ({
      hasSignal: !!window.activityStateSignal,
      current: window.activityStateSignal?.value?.current
    }));

    expect(signalState.hasSignal).toBe(true);
    expect(signalState.current).toBe(ActivityType.TUTORIAL);
  });

  test('should handle multiple signal initializations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Initialize twice
    await initializeActivitySignal(page);
    await initializeActivitySignal(page);

    const signalState = await page.evaluate(() => ({
      hasSignal: !!window.activityStateSignal,
      current: window.activityStateSignal?.value?.current
    }));

    expect(signalState.hasSignal).toBe(true);
    expect(signalState.current).toBe(ActivityType.TUTORIAL);
  });
});
