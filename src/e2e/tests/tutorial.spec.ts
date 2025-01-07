import { test, expect, type Page } from '@playwright/test';
import { TerminalPage } from '../page-objects/TerminalPage';
import type { GamePhrase } from '../../types/Types';
import { Phrases } from '../../types/Types';
import { TEST_CONFIG } from '../config';

// Constants for timeouts
const TIMEOUTS = {
  short: TEST_CONFIG.timeout.short,
  medium: TEST_CONFIG.timeout.medium,
  long: TEST_CONFIG.timeout.long,
  transition: TEST_CONFIG.timeout.transition
} as const;

// Type guards and interfaces
interface TutorialState {
  currentStep: number;
}

interface TutorialSignalState {
  tutorialSignal: unknown;
  activitySignal: unknown;
  completedTutorials: string | null;
  tutorialState: string | null;
}

interface StorageState {
  completedTutorials: string | null;
  tutorialState: string | null;
}

function isTutorialState(value: unknown): value is TutorialState {
  return typeof value === 'object' &&
         value !== null &&
         'currentStep' in value &&
         typeof (value as TutorialState).currentStep === 'number';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function isError(value: unknown): value is Error {
  return value instanceof Error;
}

function safeParse<T>(json: string | null): T | null {
  if (json === null) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

let terminalPage: TerminalPage;
let completedTutorials: string[] = [];

/**
 * Helper function to verify tutorial completion
 * @param page Playwright page object
 * @param tutorialKey The tutorial key to check
 * @returns Promise<boolean> True if tutorial is completed
 */
async function isTutorialCompleted(page: Page, tutorialKey: string): Promise<boolean> {
  try {
    return await page.evaluate((key: string): boolean => {
      function safeParse<T>(json: string | null): T | null {
        if (json === null) return null;
        try {
          return JSON.parse(json) as T;
        } catch {
          return null;
        }
      }

      function isStringArray(value: unknown): value is string[] {
        return Array.isArray(value) && value.every(item => typeof item === 'string');
      }

      const completedTutorials = localStorage.getItem('completed-tutorials');
      const parsed = safeParse<unknown>(completedTutorials);
      if (!isStringArray(parsed)) {
        console.log('[Tutorial Parse Error] completed-tutorials is not a string array');
        return false;
      }
      return parsed.includes(key);
    }, tutorialKey);
  } catch (error) {
    const message = isError(error) ? error.message : 'Unknown error';
    console.log('[Tutorial Check Error]', message);
    return false;
  }
}

/**
 * Helper function to log tutorial state
 */
async function logTutorialState(page: Page, label: string): Promise<void> {
  const state = await page.evaluate((): TutorialSignalState => ({
    tutorialSignal: window.tutorialSignal?.value ?? null,
    activitySignal: window.activitySignal?.value ?? null,
    completedTutorials: localStorage.getItem('completed-tutorials'),
    tutorialState: localStorage.getItem('tutorial-state')
  }));
  console.log(`[${label}]`, state);
}

/**
 * Helper function to parse and validate tutorial state
 */
async function getTutorialState(page: Page): Promise<{ tutorials: Set<string>; state: TutorialState | null }> {
  const actualState = await page.evaluate((): StorageState => ({
    completedTutorials: localStorage.getItem('completed-tutorials'),
    tutorialState: localStorage.getItem('tutorial-state')
  }));

  let tutorials = new Set<string>();
  const parsedTutorials = safeParse<unknown>(actualState.completedTutorials);
  if (isStringArray(parsedTutorials)) {
    tutorials = new Set<string>(parsedTutorials);
  } else if (parsedTutorials !== null) {
    console.log('[State Error] completed-tutorials is not a string array:', parsedTutorials);
  }

  let state: TutorialState | null = null;
  const parsedState = safeParse<unknown>(actualState.tutorialState);
  if (isTutorialState(parsedState)) {
    state = parsedState;
  } else if (parsedState !== null) {
    console.log('[State Error] Invalid tutorial state format:', parsedState);
  }

  return { tutorials, state };
}

test.describe('Tutorial Mode', () => {
  test.describe.serial('tutorial progression', () => {
    test.beforeAll(() => {
      // Reset state at start of suite
      completedTutorials = [];
    });

    test.beforeEach(async ({ context, page }) => {
      test.setTimeout(TIMEOUTS.long);

      // Initialize localStorage with test data and restore completed tutorials
      await context.addInitScript(tutorials => {
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
        if (tutorials.length > 0) {
          window.localStorage.setItem('completed-tutorials', JSON.stringify(tutorials));
        }
      }, [completedTutorials]);

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

      // Wait for application to load with retry
      await test.step('Wait for application', async () => {
        try {
          await page.waitForSelector('#handterm-wrapper', { state: 'attached', timeout: TIMEOUTS.medium });
        } catch (error: unknown) {
          const html = await page.content();
          console.log('[Page Content]', html);

          const message = typeof error === 'object' && error !== null && 'message' in error &&
            typeof error.message === 'string' ? error.message : 'Unknown error occurred';
          throw new Error(`Application failed to load: ${message}`);
        }
      });

      // Wait for signals to be exposed with retry
      await test.step('Wait for signals', async () => {
        await page.waitForFunction(() => {
          return typeof window.setActivity === 'function' &&
                 typeof window.setNextTutorial === 'function' &&
                 typeof window.ActivityType !== 'undefined';
        }, { timeout: TIMEOUTS.medium });
      });

      // Set activity to TUTORIAL mode and initialize tutorial
      await page.evaluate(([tutorial]) => {
        window.setActivity(window.ActivityType.TUTORIAL);
        window.setNextTutorial(tutorial);
      }, [Phrases[0] ?? null] as [GamePhrase | null]);

      await terminalPage.goto();
      await logTutorialState(page, 'Initial Setup');

      // Verify tutorial state is appropriate for current test
      const expectedTutorials = new Set(completedTutorials);
      const { tutorials: actualTutorials, state: tutorialState } = await getTutorialState(page);

      // Verify completed tutorials
      expect(actualTutorials, 'Completed tutorials mismatch').toEqual(expectedTutorials);

      // Verify tutorial state
      expect(tutorialState, 'Tutorial state missing or invalid').toEqual({ currentStep: 0 });
    });

    test('should start with initial tutorial', async ({ page }) => {
      // Wait for initial tutorial
      await terminalPage.waitForTutorialMode();
      await expect(terminalPage.tutorialMode).toBeVisible({ timeout: TIMEOUTS.short });
      await logTutorialState(page, 'Before Enter');

      // Ensure terminal is focused
      await terminalPage.focus();
      await terminalPage.pressEnter();
      await terminalPage.waitForPrompt();

      await logTutorialState(page, 'After Enter');
    });

    test('should complete fdsa tutorial', async ({ page }) => {
      // Verify we're at the right step
      expect(completedTutorials, 'Unexpected completed tutorials before fdsa').toEqual([]);

      // Ensure terminal is focused
      await terminalPage.focus();
      await terminalPage.typeKeys('fdsa');
      await terminalPage.pressEnter();
      await terminalPage.waitForPrompt();

      // Verify completion
      expect(await isTutorialCompleted(page, 'fdsa'), 'fdsa tutorial not marked as completed').toBeTruthy();

      // Save completion state
      completedTutorials.push('fdsa');
      await logTutorialState(page, 'After fdsa');
    });

    test('should complete jkl; tutorial', async ({ page }) => {
      // Verify we're at the right step
      expect(completedTutorials, 'Unexpected completed tutorials before jkl;').toEqual(['fdsa']);

      // Ensure terminal is focused
      await terminalPage.focus();
      await terminalPage.typeKeys('jkl;');
      await terminalPage.pressEnter();
      await terminalPage.waitForPrompt();

      // Verify completion
      expect(await isTutorialCompleted(page, 'jkl;'), 'jkl; tutorial not marked as completed').toBeTruthy();

      // Save completion state
      completedTutorials.push('jkl;');
      await logTutorialState(page, 'After jkl;');
    });

    test('should transition to game mode', async ({ page }) => {
      // Verify we're at the right step
      expect(completedTutorials, 'Unexpected completed tutorials before game transition').toEqual(['fdsa', 'jkl;']);

      await terminalPage.waitForActivityTransition();
      await expect(terminalPage.tutorialMode, 'Tutorial mode still visible after transition').not.toBeVisible({ timeout: TIMEOUTS.transition });
      await expect(terminalPage.gameMode, 'Game mode not visible after transition').toBeVisible({ timeout: TIMEOUTS.transition });
      await logTutorialState(page, 'After Game Transition');
    });

    test('should complete game phrase and return to tutorial', async ({ page }) => {
      // Verify we're at the right step
      expect(completedTutorials, 'Unexpected completed tutorials before game phrase').toEqual(['fdsa', 'jkl;']);

      await terminalPage.waitForNextChars('all sad lads ask dad; alas fads fall');

      // Ensure terminal is focused
      await terminalPage.focus();
      await terminalPage.typeKeys('all sad lads ask dad; alas fads fall');
      await terminalPage.pressEnter();
      await terminalPage.waitForPrompt();

      // Verify return to tutorial
      await expect(terminalPage.gameMode, 'Game mode still visible after completion').not.toBeVisible({ timeout: TIMEOUTS.transition });
      await expect(terminalPage.tutorialMode, 'Tutorial mode not visible after completion').toBeVisible({ timeout: TIMEOUTS.transition });
      await logTutorialState(page, 'Final State');
    });
  });
});
