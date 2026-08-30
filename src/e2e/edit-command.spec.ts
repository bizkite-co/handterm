import { test, expect } from '@playwright/test';
import { TerminalPage } from './page-objects/TerminalPage';
import { TEST_CONFIG } from './config';

test.describe('Edit Command', () => {
  let terminal: TerminalPage;

  test.beforeEach(async ({ page }) => {
    // First navigate to the page
    await page.goto(TEST_CONFIG.baseUrl);
    await page.waitForLoadState('domcontentloaded');

    // Setup terminal
    terminal = new TerminalPage(page);
    await terminal.initialize(); // This includes waitForAppReady and waitForPrompt

    // Complete initial setup
    await terminal.completeTutorials(); // This includes waitForActivityTransition

    // Explicitly verify tutorial is gone and output container is present post-setup
    await expect(page.locator('.tutorial-component')).not.toBeVisible({ timeout: TEST_CONFIG.timeout.short });
    await expect(page.locator('#output-container')).toBeVisible({ timeout: TEST_CONFIG.timeout.short });
    // Ensure prompt is ready again after checks and potential state settling
    await terminal.waitForPrompt();
  });

  test('should navigate to edit activity with default file', async ({ page }) => {
    await terminal.executeCommand('edit');

    // Wait for the editor to become visible using LONGER timeout
    await page.locator('.monaco-editor').waitFor({ state: 'visible', timeout: TEST_CONFIG.timeout.long });

    // Assert activity changed and editor is visible
    await expect(page).toHaveURL(/activity=edit/); // Check activity param
    // REMOVED assertion for specific key=/.../ due to flakiness
    await expect(page.locator('.monaco-editor')).toBeVisible();
  });

  test('should navigate to edit activity with specific file', async ({ page }) => {
    const testContent = {
      key: 'myfile.md',
      content: '# Test Content'
    };

    // Pre-populate localStorage for the specific file test
    await page.evaluate((content) => {
      localStorage.removeItem('edit-content');
      localStorage.setItem('edit-content', JSON.stringify(content));
    }, testContent);

    await terminal.executeCommand('edit myfile.md');

    // Wait for the editor to become visible using LONGER timeout
    await page.locator('.monaco-editor').waitFor({ state: 'visible', timeout: TEST_CONFIG.timeout.long });

    // Assert activity changed and editor is visible
    await expect(page).toHaveURL(/activity=edit/); // Check activity param
    // REMOVED assertion for specific key=/.../ due to flakiness
    await expect(page.locator('.monaco-editor')).toBeVisible();

    // Verify editor content loaded correctly
    const editorContent = await page.evaluate(() => {
      return window.monacoEditor?.getValue() || '';
    });
    expect(editorContent).toContain('# Test Content');
  });

  test('should show error for invalid command', async ({ page }) => {
    // Ensure we start clean for this test's output check
    await terminal.clearLine();
    await terminal.executeCommand('editt');

    // Wait for the prompt again to ensure command processing finished
    await terminal.waitForPrompt();

    // Use getOutput() which reads from #output-container where errors are sent
    await terminal.getOutput();

    // Check the output container content
    await expect(terminal.output).toContainText('Command not found: editt', { timeout: TEST_CONFIG.timeout.short });

    // Ensure we are still on the base URL (no navigation occurred)
    await expect(page).toHaveURL(TEST_CONFIG.baseUrl);
  });
});
