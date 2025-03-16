import { test, expect, type Page } from '@playwright/test';
import { TerminalPage } from '../page-objects/TerminalPage';
import { TEST_CONFIG } from '../config';
import { type GamePhrase, Phrases, StorageKeys, ActivityType } from '@handterm/types';
import { parseLocation } from '../../utils/navigationUtils';

test.describe('Edit Content Display', () => {
  let page: Page;
  let terminal: TerminalPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(TEST_CONFIG.baseUrl);
    await page.waitForLoadState('domcontentloaded');

    // Initialize terminal page object
    terminal = new TerminalPage(page);

    // Wait for the application to be ready
    await page.waitForSelector('#handterm-wrapper', {
      state: 'attached',
      timeout: TEST_CONFIG.timeout.long
    });

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
    }, { phrases: Phrases, completedTutorials: StorageKeys.completedTutorials });

    // Complete tutorials to ensure we're in the right state
    await terminal.completeTutorials();
  });

  test('setActivity function updates activity state', async () => {
    await terminal.completeTutorials();
    await terminal.waitForPrompt();

    // Navigate to edit activity using URL
    await page.goto(`${TEST_CONFIG.baseUrl}?activity=edit`);

    // Verify activity state was updated
    const url = page.url();
    const parsedLocation = parseLocation(url);
    expect(parsedLocation.activityKey).toBe(ActivityType.EDIT);
  });

  test('transitions to edit mode and displays content', async () => {
    await terminal.completeTutorials();
    await terminal.waitForPrompt();

    // Execute edit command
    await terminal.executeCommand('edit _index.md');

    // Verify URL changes
    await expect(page).toHaveURL(/activity=edit&key=_index\.md/);

    // Verify editor becomes visible
    const editorContainer = page.locator('.monaco-editor');
    await expect(editorContainer).toBeVisible({ timeout: TEST_CONFIG.timeout.short });

    // Verify editor content matches the expected content
    const editorContent = await page.evaluate((editContent: string) => {
      const editor = (window as any).monacoEditor;
      if (!editor) throw new Error('Monaco editor not found');
      const stored = localStorage.getItem(editContent);
      if (!stored) throw new Error('No content found in localStorage');
      return JSON.parse(stored).content;
    }, StorageKeys.editContent);

    // Fetch expected content directly
    const expectedContent = await page.evaluate(async () => {
      const response = await fetch('/api/content/_index.md');
      const data = await response.json();
      return data.content.content;
    });

    expect(editorContent).toBe(expectedContent);
  });

  test('shows error for non-existent file', async () => {
    await terminal.completeTutorials();
    await terminal.waitForPrompt();

    // Execute edit command for a non-existent file
    await terminal.executeCommand('edit nonexistent.md');

   // Verify we stay in normal mode
    const url = page.url();
    const parsedLocation = parseLocation(url);
    expect(parsedLocation.activityKey).toBe(ActivityType.NORMAL);

    // Wait for error message
    const error = page.locator('text=File not found');
    await expect(error).toBeVisible({ timeout: TEST_CONFIG.timeout.short });
  });

  test.afterEach(async () => {
    await page.close();
  });
});
