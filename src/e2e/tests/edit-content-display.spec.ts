import { test, expect, type Page } from '@playwright/test';
import { TerminalPage } from '../page-objects/TerminalPage';
import { TEST_CONFIG } from '../config';
import { Phrases, type GamePhrase, type ActivityType, StorageKeys } from '@handterm/types';

test.describe('Edit Content Display', () => {
  let page: Page;
  let terminal: TerminalPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(TEST_CONFIG.baseUrl);
    terminal = new TerminalPage(page);
    await terminal.goto();

    // Set up initial state, including tutorial completion
    await page.evaluate((props: {phrases: GamePhrase[], completedTutorials:string}) => {
      const {phrases, completedTutorials } = props;
      // Set up Phrases in window context
      (window as any).Phrases = phrases;

      // Get all tutorial keys and mark as complete
      const allTutorialKeys = phrases
        .filter(t => t.displayAs === 'Tutorial')
        .map(t => t.key);
      localStorage.setItem(completedTutorials, JSON.stringify(allTutorialKeys));

      // Set up minimal signals for test
      const win = window as any;
      win.completedTutorialsSignal = { value: new Set(allTutorialKeys) };
      win.tutorialSignal = { value: null }; // Start with no tutorial active
      win.activityStateSignal = {
        value: {
          current: 'normal' as ActivityType,
          previous: 'tutorial' as ActivityType, // Assuming we transitioned from tutorial
          transitionInProgress: false,
          tutorialCompleted: true // Mark tutorial as completed
        }
      };

      // Set up activity setter (important for transitioning to edit mode)
      win.setActivity = (activity: ActivityType) => {
        console.log('Setting activity to:', activity);
        win.activityStateSignal.value = {
          ...win.activityStateSignal.value,
          current: activity
        };
      };
    }, {phrases:Phrases, completedTutorials:StorageKeys.completedTutorials});

    // Wait for application to be ready
    await page.waitForSelector('#handterm-wrapper', { state: 'attached', timeout: TEST_CONFIG.timeout.short });
  });

  test('transitions to edit mode and displays content', async () => {
    // Execute edit command
    await terminal.executeCommand('edit _index.md');

    // Wait for activity state to update to 'edit' by checking URL
    await expect(page).toHaveURL(/activity=edit\?key=_index\.md/, { timeout: TEST_CONFIG.timeout.medium });
  });

  test('shows error for non-existent file', async () => {
    await terminal.executeCommand('edit nonexistent.md');

    // Verify we stay in normal mode
    const activityState = await page.evaluate(() =>
      window.activityStateSignal.value.current
    );
    expect(activityState).toBe('normal');

    // Wait for error message
    const error = page.locator('text=File not found');
    await expect(error).toBeVisible({ timeout: TEST_CONFIG.timeout.short });
  });

  test.afterEach(async () => {
    await page.close();
  });
});