import { ActivityType } from '@handterm/types';
import type { Page } from '@playwright/test';

export async function initializeActivitySignal(page: Page): Promise<void> {
  await page.evaluate(({ NORMAL }) => {
    // Simplified signal without persistence
    window.activityStateSignal = {
      value: {
        current: NORMAL,
        previous: null,
        transitionInProgress: false,
        tutorialCompleted: false
      }
    };
    return true;
  }, {
    NORMAL: ActivityType.NORMAL
  });

  const signalState = await page.evaluate(() => ({
    hasSignal: !!window.activityStateSignal,
    current: window.activityStateSignal?.value?.current
  }));

  if (!signalState.hasSignal || signalState.current !== ActivityType.NORMAL) {
    throw new Error('Signal initialization failed');
  }
}

export async function verifySignalState(page: Page): Promise<void> {
  const signalState = await page.evaluate(() => ({
    hasSignal: !!window.activityStateSignal,
    current: window.activityStateSignal?.value?.current,
    fullValue: window.activityStateSignal?.value
  }));

  console.log('Signal verification state:', signalState);

  if (!signalState.hasSignal || !signalState.current) {
    throw new Error(`Signal verification failed: ${JSON.stringify(signalState, null, 2)}`);
  }
}
