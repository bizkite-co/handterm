import { test, expect } from '@playwright/test';
import { TerminalPage } from './page-objects/TerminalPage';
import { TEST_CONFIG } from './config';
import { ActivityType } from '@handterm/types';
import { initializeActivitySignal, verifySignalState } from './helpers/initializeSignals';

declare global {
  interface Window {
    activityStateSignal: {
      value: {
        current: ActivityType;
        previous: ActivityType | null;
        transitionInProgress: boolean;
        tutorialCompleted: boolean;
      };
    };
  }
}

test.describe('Edit Command', () => {
  let terminal: TerminalPage;

  test.beforeEach(async ({ page }) => {
    // First navigate to the page
    await page.goto(TEST_CONFIG.baseUrl);
    await page.waitForLoadState('domcontentloaded');

    // Initialize signals
    await initializeActivitySignal(page);

    // Setup terminal
    terminal = new TerminalPage(page);
    await terminal.initialize();

    // Verify setup
    await verifySignalState(page);

    // Complete initial setup
    await terminal.completeTutorials();
    await terminal.waitForPrompt();
  });

  test('should navigate to edit activity with default file', async ({ page }) => {
    await terminal.executeCommand('edit');

    await page.waitForFunction(
      (args) => window.activityStateSignal?.value?.current === args.EDIT,
      { EDIT: ActivityType.EDIT },
      { timeout: TEST_CONFIG.timeout.long }
    );

    await expect(page).toHaveURL(/activity=edit/);
    await expect(page).toHaveURL(/key=_index\.md/);
    await expect(page.locator('.monaco-editor')).toBeVisible();
  });

  test('should navigate to edit activity with specific file', async ({ page }) => {
    const testContent = {
      key: 'myfile.md',
      content: '# Test Content'
    };

    await page.evaluate((content) => {
      localStorage.setItem('edit-content', JSON.stringify(content));
    }, testContent);

    await terminal.executeCommand('edit myfile.md');

    await page.waitForFunction(
      (args) => window.activityStateSignal?.value?.current === args.EDIT,
      { EDIT: ActivityType.EDIT },
      { timeout: TEST_CONFIG.timeout.long }
    );

    await expect(page).toHaveURL(/activity=edit\?key=myfile\.md/);
    await expect(page.locator('.monaco-editor')).toBeVisible();

    const editorContent = await page.evaluate(() => {
      return window.monacoEditor?.getValue() || '';
    });
    expect(editorContent).toContain('# Test Content');
  });

  test('should show error for invalid command', async ({ page }) => {
    await terminal.executeCommand('editt');
    const output = await terminal.getOutput();
    expect(output).toContain('Command not found');

    await page.waitForFunction(
      () => window.activityStateSignal?.value?.current === ActivityType.NORMAL,
      { timeout: TEST_CONFIG.timeout.long }
    );

    await expect(page).toHaveURL(TEST_CONFIG.baseUrl);
  });
});
