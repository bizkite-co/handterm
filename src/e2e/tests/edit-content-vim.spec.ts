import { test, expect, type Page } from '@playwright/test';
import { TerminalPage } from '../page-objects/TerminalPage';
import { EditorPage } from '../page-objects/EditorPage';
import { TEST_CONFIG } from '../config';
import { Phrases, type GamePhrase, type ActivityType, StorageKeys } from '@handterm/types';

/**
 * Tests for Vim mode in the Monaco editor.
 * Uses TerminalPage for terminal interaction and EditorPage for editor interaction.
 * Both are TUI (Text User Interface) elements that only accept keyboard input.
 */
test.describe('Edit Content Vim Navigation', () => {
  let page: Page;
  let terminal: TerminalPage;
  let editor: EditorPage;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(TEST_CONFIG.baseUrl);
    terminal = new TerminalPage(page);
    editor = new EditorPage(page);
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
      localStorage.setItem(StorageKeys.completedTutorials, JSON.stringify(allTutorialKeys));

      // Set up minimal signals for test
      const win = window as any;
      win.completedTutorialsSignal = { value: new Set(allTutorialKeys) };
      win.tutorialSignal = { value: null };
      win.activityStateSignal = {
        value: {
          current: 'normal' as ActivityType,
          previous: 'tutorial' as ActivityType,
          transitionInProgress: false,
          tutorialCompleted: true
        }
      };
    }, Phrases);

    // Wait for application to be ready
    await page.waitForSelector('#handterm-wrapper', { state: 'attached', timeout: TEST_CONFIG.timeout.short });
  });

  test('initializes Vim mode correctly', async () => {
    // Set up test content
    const testContent = {
      key: '_index.md',
      content: '# Test Content'
    };
    await page.evaluate((content) => {
      localStorage.setItem(StorageKeys.editContent, JSON.stringify(content));
    }, testContent);

    // Enter edit mode
    await terminal.executeCommand('edit _index.md');

    // Wait for editor and verify Vim mode
    await editor.waitForEditor();
    await editor.focus();

    // Verify content is loaded
    const content = await editor.getContent();
    console.log('Editor content:', content);
    expect(content).toBe(testContent.content);

    // Verify Vim mode
    const vimMode = await editor.getVimMode();
    expect(vimMode).toContain('NORMAL');
  });

  test('moves cursor left with h key', async () => {
    // Set up test content
    const testContent = {
      key: '_index.md',
      content: '# Test Content'
    };
    await page.evaluate((content) => {
      localStorage.setItem(StorageKeys.editContent, JSON.stringify(content));
    }, testContent);

    // Enter edit mode
    await terminal.executeCommand('edit _index.md');

    // Wait for editor and ensure normal mode
    await editor.waitForEditor();
    await editor.focus();

    // Verify content is loaded
    const content = await editor.getContent();
    console.log('Editor content:', content);
    expect(content).toBe(testContent.content);

    // Get initial cursor position
    const initialPosition = await editor.getCursorPosition();
    console.log('Initial position:', initialPosition);

    // Send 'h' key
    await editor.sendKeys('h');

    // Get new position
    const newPosition = await editor.getCursorPosition();
    console.log('New position:', newPosition);

    // Verify cursor moved left
    expect(newPosition.column).toBe(initialPosition.column - 1);
    expect(newPosition.lineNumber).toBe(initialPosition.lineNumber);
  });

  test.afterEach(async () => {
    await page.close();
  });
});