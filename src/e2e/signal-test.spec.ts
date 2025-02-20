import { test, expect, type Page } from '@playwright/test';
import { setCompletedTutorial } from '../signals/tutorialSignals';

declare global {
  interface Window {
    callSetCompletedTutorial: (key: string) => void;
  }
}

test.describe('Signal Initialization', () => {
  test('should correctly initialize and use tutorialSignal', async ({ page }) => {
    await page.addInitScript(() => {
      window.callSetCompletedTutorial = (key: string) => setCompletedTutorial(key);
    });

    await page.waitForTimeout(500); // Add a delay

    const hasFunction = await page.evaluate(() => typeof window.callSetCompletedTutorial === 'function');
    expect(hasFunction).toBe(true);
  });
});