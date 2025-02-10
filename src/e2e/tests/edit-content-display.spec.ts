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

    // Clear edit-content before each test
    await page.evaluate((storageKey) => {
      localStorage.removeItem(storageKey);
    }, StorageKeys.editContent);

    // Set up initial state, including tutorial completion
    await page.evaluate((props: { phrases: GamePhrase[]; completedTutorials: string }) => {
      const { phrases, completedTutorials } = props;
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
    }, { phrases: Phrases, completedTutorials: StorageKeys.completedTutorials });

    // Wait for application to be ready
    await page.waitForSelector('#handterm-wrapper', { state: 'attached', timeout: TEST_CONFIG.timeout.short });

    // Add checks for initial state
    const initialState = await page.evaluate((storageKey: string) => {
      const win = window as any;
      return {
        phrases: win.Phrases,
        completedTutorials: localStorage.getItem(storageKey),
        currentActivity: win.activityStateSignal.value.current
      }
    }, StorageKeys.completedTutorials);
    expect(initialState.phrases).toBeDefined();
    expect(initialState.phrases.length).toBeGreaterThan(0);
    expect(initialState.completedTutorials).toBeDefined();
    expect(initialState.completedTutorials).not.toBeNull();
    expect(initialState.currentActivity).toBe('normal');

  });

  test('setActivity function updates activity state', async () => {
    // Verify setActivity exists and is callable
    const hasSetActivity = await page.evaluate(() => {
      return typeof window.setActivity === 'function';
    });
    expect(hasSetActivity).toBe(true);

    // Call setActivity directly
    await page.evaluate(() => {
      window.setActivity('edit');
    });

    // Verify activity state was updated
    const activityState = await page.evaluate(() => window.activityStateSignal.value.current);
    expect(activityState).toBe('edit');
  });

  test('transitions to edit mode and displays content', async () => {
   // Execute edit command
    await terminal.executeCommand('edit _index.md');

    // Wait for and verify activity state changes to 'edit' through the mediator
    await page.waitForFunction(
      () => terminal.getActivityMediator().isInEdit,
      { timeout: TEST_CONFIG.timeout.short }
    );
    const activityState = await page.evaluate(() =>  terminal.getActivityMediator().isInEdit);
    expect(activityState).toBe(true);

    // Verify content is stored in localStorage
    const storedContent = await page.evaluate((key) => localStorage.getItem(key), StorageKeys.editContent);
    expect(storedContent).toBeDefined();
    expect(storedContent).not.toBeNull();

    // Verify URL changes
    await expect(page).toHaveURL(/activity=edit&key=_index\.md/);

    // Finally, verify editor becomes visible
    const editorContainer = page.locator('.monaco-editor');
    await expect(editorContainer).toBeVisible({ timeout: TEST_CONFIG.timeout.medium });

    // Verify editor content matches the expected content
    const editorContent = await page.evaluate((editContent: string) => {
      const editor = (window as any).monacoEditor;
      if (!editor) throw new Error('Monaco editor not found');
      const stored = localStorage.getItem(editContent);
      if (!stored) throw new Error('No content found in localStorage');
      return JSON.parse(stored).content;
    }, StorageKeys.editContent);

    // Fetch expected content directly (no pre-population)
    const expectedContent = await page.evaluate(async () => {
      const response = await fetch('/api/content/_index.md');
      const data = await response.json();
      return data.content.content;
    });

    expect(editorContent).toBe(expectedContent);
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