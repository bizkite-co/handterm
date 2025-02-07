import { test, expect, type Page } from '@playwright/test';
import { TerminalPage } from '../page-objects/TerminalPage';
import { TEST_CONFIG } from '../config';
import { Phrases, type GamePhrase } from '@handterm/types';

test.describe('Edit Content Display', () => {
  let page: Page;
  let terminal: TerminalPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(TEST_CONFIG.baseUrl);
    terminal = new TerminalPage(page);
    await terminal.goto();

    // Set up initial state
    await page.evaluate((phrases: GamePhrase[]) => {
      // Set up Phrases in window context
      (window as any).Phrases = phrases;

      // Get all tutorial keys
      const allTutorialKeys = phrases
        .filter(t => t.displayAs === 'Tutorial')
        .map(t => t.key);

      // Store completed tutorials
      localStorage.setItem('completed-tutorials', JSON.stringify(allTutorialKeys));

      // Set up minimal signals for test
      const win = window as any;
      win.completedTutorialsSignal = { value: new Set(allTutorialKeys) };
      win.tutorialSignal = { value: null };
      win.activityStateSignal = {
        value: {
          current: 'normal',
          previous: 'tutorial',
          transitionInProgress: false,
          tutorialCompleted: true
        }
      };
    }, Phrases);

    // Wait for application to be ready
    await page.waitForSelector('#handterm-wrapper', { state: 'attached', timeout: TEST_CONFIG.timeout.medium });
  });

  test('displays content in editor when in edit mode', async () => {
    // Set up test content
    const testContent = {
      key: '_index.md',
      content: '# Test Content'
    };
    await page.evaluate((content) => {
      localStorage.setItem('edit-content', JSON.stringify(content));
    }, testContent);

    // Execute edit command
    await terminal.executeCommand('edit _index.md');

    // Verify editor is visible and shows content
    const editor = page.locator('.monaco-editor');
    await expect(editor).toBeVisible({ timeout: TEST_CONFIG.timeout.medium });

    const editorContent = await page.evaluate(() => {
      const editor = (window as any).monacoEditor;
      if (!editor) throw new Error('Monaco editor not found');
      return editor.getValue();
    });
    expect(editorContent).toBe(testContent.content);
  });

  test('shows error for non-existent file', async () => {
    await terminal.executeCommand('edit nonexistent.md');

    const error = page.locator('.error-message');
    await expect(error).toContainText('File not found', { timeout: TEST_CONFIG.timeout.medium });
  });

  test.afterEach(async () => {
    await page.close();
  });
});