import { test, expect, type Page } from '@playwright/test';
import { TerminalPage } from '../page-objects/TerminalPage';
import type { GamePhrase } from '../../types/Types';
import { Phrases } from '../../types/Types';
import { TEST_CONFIG } from '../config';

let terminalPage: TerminalPage;

/**
 * Helper function to verify tutorial completion
 * @param page Playwright page object
 * @param tutorialKey The tutorial key to check
 * @returns Promise<boolean> True if tutorial is completed
 */
async function isTutorialCompleted(page: Page, tutorialKey: string): Promise<boolean> {
  try {
    return await page.evaluate((key: string) => {
      const completedTutorials = localStorage.getItem('completed-tutorials');
      if (completedTutorials === null) return false;
      try {
        const tutorials = JSON.parse(completedTutorials) as string[];
        return Array.isArray(tutorials) && tutorials.includes(key);
      } catch {
        console.log('[Tutorial Parse Error] Invalid JSON in completed-tutorials');
        return false;
      }
    }, tutorialKey);
  } catch (error) {
    console.log('[Tutorial Check Error]', error);
    return false;
  }
}

test.beforeEach(async ({ context, page }) => {
  test.setTimeout(TEST_CONFIG.timeout.long);

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

  // Initialize page
  await page.goto(TEST_CONFIG.baseUrl);

  // Set up debugging
  page.on('console', msg => {
    console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
  });

  page.on('requestfailed', request => {
    console.log(`[Network] Request failed: ${request.url()} - ${request.failure()?.errorText}`);
  });

  // Initialize TerminalPage
  terminalPage = new TerminalPage(page);

  // Wait for application to load
  try {
    await page.waitForSelector('#handterm-wrapper', { state: 'attached', timeout: TEST_CONFIG.timeout.medium });
  } catch (error: unknown) {
    const html = await page.content();
    console.log('[Page Content]', html);

    const message = typeof error === 'object' && error !== null && 'message' in error &&
      typeof error.message === 'string' ? error.message : 'Unknown error occurred';
    throw new Error(`Application failed to load: ${message}`);
  }

  // Wait for signals to be exposed
  await page.waitForFunction(() => {
    return typeof window.setActivity === 'function' &&
           typeof window.setNextTutorial === 'function' &&
           typeof window.ActivityType !== 'undefined';
  }, { timeout: TEST_CONFIG.timeout.medium });

  // Set activity to TUTORIAL mode and initialize tutorial
  await page.evaluate(([tutorial]) => {
    window.setActivity(window.ActivityType.TUTORIAL);
    window.setNextTutorial(tutorial);
  }, [Phrases[0] ?? null] as [GamePhrase | null]);

  await terminalPage.goto();
});

test.afterEach(async ({ context }) => {
  await context.storageState();
});

test.describe('Tutorial Mode', () => {
  test('should start in tutorial mode with clean state', async () => {
    // This test will start fresh because of new context
    await terminalPage.waitForTutorialMode();
    await expect(terminalPage.tutorialMode).toBeVisible();
    await expect(terminalPage.gameMode).not.toBeVisible();
  });

  test.describe('tutorial progression', () => {
    test('should start with initial tutorial', async () => {
      await terminalPage.waitForTutorialMode();
      await expect(terminalPage.tutorialMode).toBeVisible();
      await terminalPage.pressEnter();
      await terminalPage.waitForPrompt();
    });

    test('should complete fdsa tutorial', async ({ page }) => {
      await terminalPage.typeKeys('fdsa');
      await terminalPage.pressEnter();
      await terminalPage.waitForPrompt();
      expect(await isTutorialCompleted(page, 'fdsa')).toBeTruthy();
    });

    test('should complete jkl; tutorial', async ({ page }) => {
      await terminalPage.typeKeys('jkl;');
      await terminalPage.pressEnter();
      await terminalPage.waitForPrompt();
      expect(await isTutorialCompleted(page, 'jkl;')).toBeTruthy();
    });

    test('should transition to game mode', async () => {
      await terminalPage.waitForActivityTransition();
      await expect(terminalPage.tutorialMode).not.toBeVisible({ timeout: 10000 });
      await expect(terminalPage.gameMode).toBeVisible({ timeout: 10000 });
    });

    test('should complete game phrase and return to tutorial', async () => {
      await terminalPage.waitForNextChars('all sad lads ask dad; alas fads fall');
      await terminalPage.typeKeys('all sad lads ask dad; alas fads fall');
      await terminalPage.pressEnter();
      await terminalPage.waitForPrompt();
      await expect(terminalPage.gameMode).not.toBeVisible({ timeout: 10000 });
      await expect(terminalPage.tutorialMode).toBeVisible({ timeout: 10000 });
    });
  });
});
