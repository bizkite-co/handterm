import type { Page } from '@playwright/test';

/**
 * Sets up the test environment with completed tutorials and necessary signals.
 *
 * Note: We use simplified signal implementations for testing that don't fully
 * implement the Signal interface. This is intentional as we only need the
 * minimal functionality required for the tests to work. The application code
 * uses the full Signal implementation, but for tests we just need the value
 * property and basic update functionality.
 */
export async function setupTestEnvironment(page: Page): Promise<void> {
  await page.evaluate(() => {
    // Set up completed tutorials
    const tutorials = ['\\r', 'fdsa', 'jkl;'];
    localStorage.setItem('completed-tutorials', JSON.stringify(tutorials));

    // Set up signals with minimal implementation
    // @ts-expect-error - Using simplified signal implementation for tests
    window.completedTutorialsSignal = {
      value: new Set(tutorials)
    };

    // @ts-expect-error - Using simplified signal implementation for tests
    window.tutorialSignal = {
      value: null
    };

    // @ts-expect-error - Using simplified signal implementation for tests
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

    // Set up tutorial functions
    window.setNextTutorial = (tutorial) => {
      window.tutorialSignal.value = tutorial;
    };

    window.setCompletedTutorial = (tutorialKey) => {
      window.completedTutorialsSignal.value.add(tutorialKey);
    };
  });
}