import type { Page } from '@playwright/test';
import { setActivity } from '../../signals/appSignals';
import {
  tutorialSignal,
  completedTutorialsSignal,
  setCompletedTutorial,
  getNextTutorial,
  setNextTutorial
} from '../../signals/tutorialSignals';
import { createLogger } from '../../utils/Logger';

export async function setupBrowserWindow(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.tutorialSignal = null;
    window.completedTutorialsSignal = { value: new Set() };
    window.activityStateSignal = { value: { current: 'tutorial', previous: null, transitionInProgress: false, tutorialCompleted: false } };
  });

  await page.addInitScript(`
    window.createLogger = ${createLogger.toString()};
    const logger = window.createLogger({ prefix: 'Window Setup' });

    // Expose signals
    window.tutorialSignal = ${JSON.stringify(tutorialSignal)};
    window.completedTutorialsSignal = ${JSON.stringify(completedTutorialsSignal)};

    // Expose functions
    window.setCompletedTutorial = ${setCompletedTutorial.toString()};
    window.getNextTutorial = ${getNextTutorial.toString()};
    window.setNextTutorial = ${setNextTutorial.toString()};
    window.setActivity = ${setActivity.toString()};
  `);

  // Verify the setup
  const verification = await page.evaluate(() => ({
    hasSetCompletedTutorial: typeof window.setCompletedTutorial === 'function',
    hasSetActivity: typeof window.setActivity === 'function',
    hasSignals: !!window.tutorialSignal && !!window.completedTutorialsSignal
  }));

  if (!verification.hasSetCompletedTutorial || !verification.hasSetActivity || !verification.hasSignals) {
    throw new Error(`Window setup failed: ${JSON.stringify(verification)}`);
  }
}
