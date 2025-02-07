import { test, expect, type Page } from '@playwright/test';
import { TerminalPage } from '../page-objects/TerminalPage';
import { TEST_CONFIG } from '../config';
import { Phrases, type GamePhrase, type ActivityType } from '@handterm/types';

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
          current: 'normal' as ActivityType,
          previous: 'tutorial' as ActivityType,
          transitionInProgress: false,
          tutorialCompleted: true
        }
      };

      // Set up activity setter
      win.setActivity = (activity: ActivityType) => {
        console.log('Setting activity to:', activity);
        win.activityStateSignal.value = {
          ...win.activityStateSignal.value,
          current: activity
        };
      };
    }, Phrases);

    // Wait for application to be ready
    await page.waitForSelector('#handterm-wrapper', { state: 'attached', timeout: TEST_CONFIG.timeout.short });
  });

  test('transitions to edit mode and displays content', async () => {
    // Set up test content
    const testContent = {
      key: '_index.md',
      content: '# Test Content'
    };
    await page.evaluate((content) => {
      localStorage.setItem('edit-content', JSON.stringify(content));
    }, testContent);

    // Log initial state
    const initialState = await page.evaluate(() => ({
      activity: window.activityStateSignal.value.current,
      tutorialSignal: window.tutorialSignal.value,
      editContent: localStorage.getItem('edit-content')
    }));
    console.log('Initial state:', initialState);

    // Execute edit command
    await terminal.executeCommand('edit _index.md');

    // Log state after command
    const afterCommandState = await page.evaluate(() => ({
      activity: window.activityStateSignal.value.current,
      editContent: localStorage.getItem('edit-content')
    }));
    console.log('After command state:', afterCommandState);

    // Wait for activity state to update
    await page.waitForFunction(
      () => {
        console.log('Current activity:', window.activityStateSignal.value.current);
        return window.activityStateSignal.value.current === 'edit';
      },
      { timeout: TEST_CONFIG.timeout.medium }
    );

    // Wait for Monaco container to be rendered by React
    const editorContainer = page.locator('div[style*="height: 100%"][style*="width: 100%"]');
    await expect(editorContainer).toBeVisible({ timeout: TEST_CONFIG.timeout.medium });

    // Wait for Monaco editor to be initialized
    await page.waitForFunction(() => {
      const editor = (window as any).monacoEditor;
      return editor !== null && editor !== undefined;
    }, { timeout: TEST_CONFIG.timeout.medium });

    // Verify editor content
    const editorContent = await page.evaluate(() => {
      const editor = (window as any).monacoEditor;
      return editor.getValue();
    });
    expect(editorContent).toBe(testContent.content);
  });

  test('shows error for non-existent file', async () => {
    await terminal.executeCommand('edit nonexistent.md');

    // Log state after command
    const afterCommandState = await page.evaluate(() => ({
      activity: window.activityStateSignal.value.current,
      editContent: localStorage.getItem('edit-content')
    }));
    console.log('After error command state:', afterCommandState);

    // Verify we stay in normal mode
    const activityState = await page.evaluate(() =>
      window.activityStateSignal.value.current
    );
    expect(activityState).toBe('normal');

    // Wait for error message to be displayed
    const error = page.locator('text=File not found');
    await expect(error).toBeVisible({ timeout: TEST_CONFIG.timeout.short });
  });

  test.afterEach(async () => {
    await page.close();
  });
});