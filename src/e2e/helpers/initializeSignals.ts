import { ActivityType } from '@handterm/types';
import type { Page } from '@playwright/test';

export async function initializeActivitySignal(page: Page): Promise<void> {
  await page.evaluate(({ NORMAL }) => {
    // Only use URL params if explicitly set, otherwise use NORMAL
    const urlParams = new URLSearchParams(window.location.search);
    const activityParam = urlParams.get('activity') as ActivityType | null;
    const initialActivity = activityParam || NORMAL;

    window.activityStateSignal = {
      value: {
        current: initialActivity,
        previous: null,
        transitionInProgress: false,
        tutorialCompleted: false
      }
    };

    console.log('[Signal Init] Setting initial activity:', initialActivity);
    return true;
  }, {
    NORMAL: ActivityType.NORMAL
  });

  const signalState = await page.evaluate(() => ({
    hasSignal: !!window.activityStateSignal,
    current: window.activityStateSignal?.value?.current,
    url: window.location.href
  }));

  console.log('[Signal Init] Verification state:', signalState);

  if (!signalState.hasSignal || !signalState.current) {
    throw new Error(`Signal initialization failed: ${JSON.stringify(signalState, null, 2)}`);
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
