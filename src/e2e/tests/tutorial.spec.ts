/**
 * End-to-end tests for the tutorial functionality.
 *
 * Key Testing Principles:
 *
 * 1. Minimal LocalStorage Mocking: Tests should interact with the application
 *    primarily through the UI and URL, mimicking real user behavior. Avoid
 *    extensive mocking of `localStorage`. Set only the absolute minimum
 *    required values for a test to run, and clear localStorage before each test
 *    to ensure a clean state.
 * 2. URL as Source of Truth: The application uses the URL as the single source
 *    of truth for activity state. Tests should verify UI state by checking
 *    the URL, rather than relying on internal state (like `localStorage` or
 *    signals).
 * 3. Focus on User Actions: Tests simulate user actions (typing, clicking)
 *    and verify the resulting UI changes, rather than directly manipulating
 *    internal application state.
 */
// @ts-nocheck
import { test, expect } from '@playwright/test';
import {
    setCompletedTutorial,
    tutorialSignal
} from 'src/signals/tutorialSignals';
import { TEST_CONFIG } from '../config';
import { TerminalPage } from '../page-objects/TerminalPage';

test.describe('Tutorial Mode', () => {
    test.describe('tutorial progression', () => { // Changed to test.describe (parallel execution)
        test.beforeEach(async ({ page }, _testInfo) => {
            //test.setTimeout(TIMEOUTS.long);

            // Mock localStorage
            await page.addInitScript(() => {
                window.localStorage.clear();
            });
        });

        test('should complete fdsa tutorial', async ({ page }) => {
            // No longer setting a mock tutorial signal here.
            // The tutorial will be started via URL.

            // Navigate to the tutorial start
            await page.goto('/?activity=tutorial&key=fdsa');


            // Wait for the tutorial component to be visible.  This also implicitly
            // checks that we are in tutorial mode.
            await page.waitForSelector('.tutorial-component', { state: 'visible', timeout: 5000 }); // Shorter timeout

            // Type 'f'
            await page.keyboard.type('f');
            await page.waitForTimeout(500);

            // Type 'd'
            await page.keyboard.type('d');
            await page.waitForTimeout(500);

            // Type 's'
            await page.keyboard.type('s');
            await page.waitForTimeout(500);

            // Type 'a'
            await page.keyboard.type('a');
            await page.waitForTimeout(500);

            // Check if the tutorial is marked as complete in local storage.
            const completedTutorials = await page.evaluate(() => {
                return JSON.parse(localStorage.getItem('completed-tutorials') || '[]');
            });

          expect(completedTutorials).toContain('fdsa');

          // We also expect to be navigated away from the tutorial.
          await expect(page).not.toHaveURL(/activity=tutorial/);
        },
        {
            timeout: 10000 // Increased timeout for the entire test
        });
    });
});
