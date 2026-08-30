import type { Page } from '@playwright/test';
import { TEST_CONFIG } from '../config';

export async function setupBrowserWindow(page: Page): Promise<void> {
  // Wait for the app to mount and expose window functions.
  // These are set in HandTermWrapper.tsx's useEffect, which runs
  // after React mounts — so we must wait, not check immediately.
  await page.waitForFunction(() => {
    return typeof window.setActivity === 'function' &&
           typeof window.setNextTutorial === 'function' &&
           typeof window.setCompletedTutorial === 'function' &&
           typeof window.getNextTutorial === 'function';
  }, null, { timeout: TEST_CONFIG.timeout.long });
}