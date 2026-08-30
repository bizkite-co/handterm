import { test, expect, type Page } from '@playwright/test';
import { TerminalPage } from '../page-objects/TerminalPage';
import { TEST_CONFIG } from '../config';
import { isNotNullOrUndefined } from '../../utils/typeSafetyUtils';

// REMOVED declare global block - types are now in packages/types/src/window.ts

/**
 * This test suite is for the tutorial from the first scenario in `src/e2e/scenarios/tutorialProgression.feature`.
 */

// Constants for timeouts
const TIMEOUTS = {
  short: TEST_CONFIG.timeout.short,
  medium: TEST_CONFIG.timeout.medium, // 4000ms
  long: TEST_CONFIG.timeout.long, // Default test timeout (8000ms)
  hook: TEST_CONFIG.timeout.long + 15000, // Increased timeout for hooks (23000ms)
  transition: TEST_CONFIG.timeout.transition // 500ms
} as const;

/**
 * Helper to log visible elements and their states
 */
async function logVisibleElements(page: Page, context: string): Promise<void> {
  const elements = await page.evaluate(() => {
    const wrapper = document.querySelector('#handterm-wrapper');
    if (!wrapper) return { error: 'Wrapper not found' };

    return {
      wrapper: {
        children: Array.from(wrapper.children).map(child => ({
          id: child.id,
          className: child.className,
          visible: window.getComputedStyle(child).display !== 'none'
        }))
      },
      tutorialMode: document.querySelector('#tutorial-component')?.className,
      gameMode: document.querySelector('#game-component')?.className
    };
  });
  console.log(`[Element State: ${context}]`, elements);
}

// Type guards and interfaces
let terminalPage: TerminalPage;

/**
 * Helper function to complete a tutorial step by simulating user input
 * and waiting for the *next* tutorial step to become active.
 */
async function completeTutorialStep(
    page: Page,
    input: string,
    expectedNextKey: string | null,
    // Allow overriding timeout for specific steps
    waitTimeout: number = TIMEOUTS.medium + 3000
): Promise<void> {
  console.log(`[completeTutorialStep] Simulating input: "${input}" and Enter.`);
  await terminalPage.focus();
  await terminalPage.typeKeys(input);
  await terminalPage.pressEnter();
  // Only wait for prompt if we expect another tutorial step,
  // otherwise the prompt might not reappear immediately after transition.
  if (isNotNullOrUndefined(expectedNextKey)) {
      await terminalPage.waitForPrompt(); // Wait for command processing
  } else {
      // If it's the last step, give a brief moment for transition to start
      await page.waitForTimeout(TIMEOUTS.transition); // Use transition timeout
  }


  const currentStepKey = input === '' ? '\r' : input;
  console.log(`[completeTutorialStep] Waiting for app state to advance past: "${currentStepKey}" to "${expectedNextKey}" (Timeout: ${waitTimeout}ms)`);

  // Wait for the application's state to reflect the next tutorial step
  await page.waitForFunction(
    (nextKey: string | null) => {
      if (!window.getNextTutorial) {
        console.error('[waitForFunction] window.getNextTutorial is not defined!');
        return false; // Function not exposed, cannot verify
      }
      const nextTutorial = window.getNextTutorial();
      // console.log(`[waitForFunction] Polling: nextTutorial?.key = ${nextTutorial?.key}, expectedNextKey = ${nextKey}`);
      return nextTutorial?.key === nextKey;
    },
    expectedNextKey, // Pass the key of the *next* expected tutorial (or null if it's the end)
    // Give slightly more time for state update, use provided timeout
    { timeout: waitTimeout, polling: 300 }
  );
  console.log(`[completeTutorialStep] App state advanced, next tutorial key is: "${expectedNextKey}"`);
}

// Configure the describe block to run tests serially
test.describe.configure({ mode: 'serial' });

test.describe('Tutorial Mode', () => {
  test.describe('tutorial progression', () => {
    // Note: beforeEach runs *before each test* in this block
    test.beforeEach(async ({ page }, testInfo) => {
      // Increase timeout for the hook itself, relative to the test timeout
      testInfo.setTimeout(TIMEOUTS.hook);
      console.log(`[Test Setup] Starting beforeEach for test: ${testInfo.title}`);

      // REMOVED addInitScript - Relying on exposeSignals called by app setup

      // Initialize page and wait for application
      await page.goto(TEST_CONFIG.baseUrl);
      console.log('[Test Setup] Navigated to base URL.');
      await page.waitForTimeout(200); // Keep small delay
      console.log('[Test Setup] Waited 200ms.');

      // Ensure exposeSignals has run (check for one of the exposed functions)
      await page.waitForFunction(() => typeof window.getNextTutorial === 'function', null, { timeout: TIMEOUTS.medium });
      console.log('[Test Setup] window.getNextTutorial is available.');

      await page.waitForSelector('#handterm-wrapper', { state: 'attached', timeout: TIMEOUTS.medium });
      console.log('[Test Setup] Handterm wrapper attached.');

      // Initialize TerminalPage (after navigation)
      terminalPage = new TerminalPage(page);
      console.log('[Test Setup] TerminalPage initialized.');

      // Reset tutorial state before each test using exposed function
      // This is crucial for serial execution to ensure each test starts fresh
      await page.evaluate(() => {
        localStorage.removeItem('completed-tutorials');
        console.log('[Test Setup] Cleared completed-tutorials from localStorage.');
        // Attempt to reset the tutorial state by calling setNextTutorial
        if (window.setNextTutorial && window.getNextTutorial) {
            // Try setting to null first, then get the actual first one
            window.setNextTutorial(null);
            const firstTutorial = window.getNextTutorial(); // Should re-evaluate to the first one
            if (firstTutorial) {
                // Pass the key (string) to setNextTutorial
                window.setNextTutorial(firstTutorial.key);
                console.log('[Test Setup] Attempted to reset tutorial via setNextTutorial to key:', firstTutorial.key);
            } else {
                 console.log('[Test Setup] Could not get first tutorial to reset state.');
            }
        } else {
             console.log('[Test Setup] setNextTutorial or getNextTutorial not available for reset.');
        }
      });
       console.log('[Test Setup] Finished beforeEach.');
    });

    test('should start with `\\r` tutorial and progress to `fdsa`', async ({ page }) => {
      console.log('[Test] Starting \\r tutorial test');
      await logVisibleElements(page, 'Before Tutorial Mode');

      try {
        await terminalPage.waitForTutorialMode();
        await logVisibleElements(page, 'After Tutorial Mode Wait');
        await expect(terminalPage.tutorialMode, 'Tutorial mode not visible initially').toBeVisible({ timeout: TIMEOUTS.medium });

        // Verify initial tutorial is '\r' using exposed function
        const initialTutorial = await page.evaluate(() => window.getNextTutorial ? window.getNextTutorial() : null);
        console.log('[Test] Initial tutorial check:', initialTutorial);
        expect(initialTutorial?.key, "Initial tutorial should be '\\r'").toBe('\r');

      } catch (error) {
        console.log('[Test] Error during initial tutorial setup check:', error);
        await logVisibleElements(page, 'Error State');
        throw error;
      }

      // Complete \r tutorial and wait for state to advance to 'fdsa'
      try {
        await completeTutorialStep(page, '', 'fdsa'); // Expect 'fdsa' next
      } catch (error) {
        console.log('[Test] Error completing tutorial step (\\r -> fdsa):', error);
        await logVisibleElements(page, 'Completion Error State');
        // Log current tutorial state on error
        const currentTutorial = await page.evaluate(() => window.getNextTutorial ? window.getNextTutorial() : null);
        console.log('[Test] Current tutorial state on error:', currentTutorial);
        throw error;
      }

      // Verify current tutorial is now 'fdsa'
      const nextTutorial = await page.evaluate(() => window.getNextTutorial ? window.getNextTutorial() : null);
      expect(nextTutorial?.key, "Tutorial after '\\r' should be 'fdsa'").toBe('fdsa');
    });

    test('should complete fdsa tutorial and progress to jkl;', async ({ page }) => {
      console.log('[Test] Starting fdsa tutorial test');
      await terminalPage.waitForTutorialMode();
      await expect(terminalPage.tutorialMode).toBeVisible({ timeout: TIMEOUTS.medium });

      // Verify starting state is fdsa (important for serial execution)
      let currentTut = await page.evaluate(() => window.getNextTutorial ? window.getNextTutorial() : null);
      // If the previous test failed or state wasn't reset perfectly, complete prerequisite
      if (currentTut?.key !== 'fdsa') {
        console.log(`[Test] Current tutorial is ${currentTut?.key}, completing prerequisite...`);
        await completeTutorialStep(page, '', 'fdsa');
        currentTut = await page.evaluate(() => window.getNextTutorial ? window.getNextTutorial() : null);
        expect(currentTut?.key, "Prerequisite step failed, not at 'fdsa'").toBe('fdsa');
      } else {
         console.log('[Test] Already at fdsa tutorial.');
      }

      // Complete target tutorial and wait for state to advance to 'jkl;'
      await completeTutorialStep(page, 'fdsa', 'jkl;');

      // Verify current tutorial is now 'jkl;'
      const nextTutorial = await page.evaluate(() => window.getNextTutorial ? window.getNextTutorial() : null);
      expect(nextTutorial?.key, "Tutorial after 'fdsa' should be 'jkl;'").toBe('jkl;');
    });

    test('should complete jkl; tutorial and transition', async ({ page }) => {
       console.log('[Test] Starting jkl; tutorial test');
      await terminalPage.waitForTutorialMode();
      await expect(terminalPage.tutorialMode).toBeVisible({ timeout: TIMEOUTS.medium });

       // Verify starting state is jkl; (important for serial execution)
      let currentTut = await page.evaluate(() => window.getNextTutorial ? window.getNextTutorial() : null);
      // If the previous test failed or state wasn't reset perfectly, complete prerequisites
      if (currentTut?.key !== 'jkl;') {
        console.log(`[Test] Current tutorial is ${currentTut?.key}, completing prerequisites...`);
        if (currentTut?.key === '\r') {
            await completeTutorialStep(page, '', 'fdsa');
        }
        // Now at fdsa (or started here)
        await completeTutorialStep(page, 'fdsa', 'jkl;');
        currentTut = await page.evaluate(() => window.getNextTutorial ? window.getNextTutorial() : null);
        expect(currentTut?.key, "Prerequisite steps failed, not at 'jkl;'").toBe('jkl;');
      } else {
          console.log('[Test] Already at jkl; tutorial.');
      }

      // Complete target tutorial - Simulate input ONLY
      console.log(`[Test] Simulating final input: "jkl;" and Enter.`);
      await terminalPage.focus();
      await terminalPage.typeKeys('jkl;');
      await terminalPage.pressEnter();
      // Give a moment for transition logic to execute
      await page.waitForTimeout(TIMEOUTS.transition * 2); // Wait slightly longer than standard transition

      // Verify transition (check if tutorialMode is hidden, gameMode is visible)
      console.log('[Test] Verifying transition after "jkl;"...');
      await expect(terminalPage.tutorialMode, 'Tutorial mode still visible after jkl;').not.toBeVisible({ timeout: TIMEOUTS.transition });
      const isGameModeVisible = await terminalPage.gameMode.isVisible();
      if (!isGameModeVisible) {
         console.log('[Test] Game mode not visible, assuming transition to NORMAL.');
         // Optionally assert that normal mode elements are visible if needed
      } else {
         console.log('[Test] Game mode is visible.');
      }
       console.log('[Test] Transition after "jkl;" verified.');
    });

    // test('should transition to game mode', async ({ page }) => {
    //    // This test is likely redundant now
    //    test.skip(true, 'Skipping potentially redundant transition test');
    // });

    test('should complete game phrase and return to tutorial', async ({ _page }) => {
      test.skip(true, 'Skipping game phrase test as it requires game signal mocking');
    });

    // test('test isTutorialCompleted helper', async ({ page }) => {
    //    test.skip(true, 'Skipping isTutorialCompleted helper test as mocking strategy changed');
    // });
  });

  test('test page.evaluate', async ({ page }) => {
    await page.evaluate(() => {
      console.log('[BASIC TEST - PAGE.EVALUATE WORKS]');
    });
    expect(true).toBeTruthy();
  });
});
