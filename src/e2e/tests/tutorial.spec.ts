import { test, expect } from '@playwright/test';
import { TerminalPage } from '../page-objects/TerminalPage';
import type { GamePhrase } from '../../types/Types';
import { Phrases } from '../../types/Types';
import { TEST_CONFIG } from '../config';

let terminalPage: TerminalPage;

// Initialize localStorage for all tests
test.beforeEach(async ({ context }) => {
  // Initialize localStorage with test data
  await context.addInitScript(() => {
    if (typeof window.localStorage === 'undefined') {
      const localStorageMock = (() => {
        let store: Record<string, string> = {};
        return {
          getItem(key: string) {
            return store[key] ?? null;
          },
          setItem(key: string, value: string) {
            store[key] = value;
          },
          clear() {
            store = {};
          },
          removeItem(key: string) {
            store = Object.fromEntries(
              Object.entries(store).filter(([k]) => k !== key)
            );
          },
          key(index: number) {
            return Object.keys(store)[index] ?? null;
          },
          get length() {
            return Object.keys(store).length;
          }
        };
      })();
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock
      });
    }

    window.localStorage.setItem('tutorial-state', JSON.stringify({ currentStep: 0 }));
  });
});

test.afterEach(async ({ context }) => {
  // Clear localStorage after each test
  await context.storageState();
});

test.beforeEach(async ({ page }) => {
  test.setTimeout(TEST_CONFIG.timeout.long);

  // Initialize page first
  await page.goto(TEST_CONFIG.baseUrl);

  // Clear local storage to ensure clean state
  await page.evaluate(() => {
    localStorage.clear();
    window.location.reload();
  });

  terminalPage = new TerminalPage(page);

  // Capture console logs
  page.on('console', msg => {
    console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
  });

  // Capture network requests
  page.on('requestfailed', request => {
    console.log(`[Network] Request failed: ${request.url()} - ${request.failure()?.errorText}`);
  });

  // Wait for application to load
  function getErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
      return error.message;
    }
    return 'Unknown error occurred';
  }

  try {
    await page.waitForSelector('#handterm-wrapper', { state: 'attached', timeout: TEST_CONFIG.timeout.medium });
  } catch (error: unknown) {
    // Capture the page content for debugging
    const html = await page.content();
    console.log('[Page Content]', html);

    // Type-safe error handling
    const message = getErrorMessage(error);
    throw new Error(`Application failed to load: ${message}`);
  }

  // Set activity to TUTORIAL mode and initialize tutorial
  await page.evaluate(([tutorial]) => {
    if (typeof window.setActivity === 'function' && typeof window.setNextTutorial === 'function') {
      window.setActivity(window.ActivityType.TUTORIAL);
      window.setNextTutorial(tutorial);
    } else {
      throw new Error('Required window methods not found');
    }
  }, [Phrases[0] ?? null] as [GamePhrase | null]);

  await terminalPage.goto();
});

test('should progress from tutorial to game mode after completing initial steps', async ({ page }) => {
  // Given the user is in tutorial mode
  await terminalPage.waitForTutorialMode();
  await expect(terminalPage.tutorialMode).toBeVisible();

  // When the user types "Enter"
  await terminalPage.pressEnter();
  await terminalPage.waitForPrompt();

  // Complete first fdsa tutorial (without spaces)
  await terminalPage.typeKeys('fdsa');
  await terminalPage.pressEnter();
  await terminalPage.waitForPrompt();

  // Verify first fdsa tutorial completion
  const firstFdsaComplete = await page.evaluate(() => {
    const completed = localStorage.getItem('completed-tutorials');
    return completed != null ? completed.includes('fdsa') : false;
  });
  expect(firstFdsaComplete).toBeTruthy();

  // Complete jkl; tutorial
  await terminalPage.typeKeys('jkl;');
  await terminalPage.pressEnter();
  await terminalPage.waitForPrompt();

  // Verify jkl; tutorial completion
  const jklComplete = await page.evaluate(() => {
    const completed = localStorage.getItem('completed-tutorials');
    return completed != null ? completed.includes('jkl;') : false;
  });
  expect(jklComplete).toBeTruthy();

  // Wait for activity transition using page object method
  await terminalPage.waitForActivityTransition();

  // Then the Activity should change from Tutorial to Game
  await expect(terminalPage.tutorialMode).not.toBeVisible({ timeout: 10000 });
  await expect(terminalPage.gameMode).toBeVisible({ timeout: 10000 });

  // Wait for and verify the game phrase
  await terminalPage.waitForNextChars('all sad lads ask dad; alas fads fall');

  // When the user types "all sad lads ask dad; alas fads fall"
  await terminalPage.typeKeys('all sad lads ask dad; alas fads fall');
  await terminalPage.pressEnter();
  await terminalPage.waitForPrompt();

  // Then the user is returned to the tutorial
  await expect(terminalPage.gameMode).not.toBeVisible({ timeout: 10000 });
  await expect(terminalPage.tutorialMode).toBeVisible({ timeout: 10000 });
});

test('should start in tutorial mode with clean state', async () => {
  // This test will start fresh because of new context
  await terminalPage.waitForTutorialMode();
  await expect(terminalPage.tutorialMode).toBeVisible();
  await expect(terminalPage.gameMode).not.toBeVisible();
});
