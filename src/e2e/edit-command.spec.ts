import { test, expect } from '@playwright/test';
import { TerminalPage } from './page-objects/TerminalPage';

test.describe('Edit Command', () => {
  let terminal: TerminalPage;

  test.beforeEach(async ({ page }) => {
    terminal = new TerminalPage(page);
    await terminal.goto();
    await terminal.completeTutorials();

    // Debug: Log current URL after completing tutorials
    console.log('URL after completing tutorials:', page.url());

    // Wait for terminal to be ready
    await terminal.waitForPrompt();
  });

  test('should navigate to edit activity with default file', async ({ page }) => {
    // Debug: Log initial state
    const initialState = await page.evaluate(() => ({
      localStorage: {
        activity: localStorage.getItem('current-activity'),
        completedTutorials: localStorage.getItem('completed-tutorials')
      },
      url: window.location.href
    }));
    console.log('Initial state:', initialState);

    // Debug: Log before command execution
    console.log('Executing edit command...');
    await terminal.executeCommand('edit');

    // Debug: Log immediate state after command
    const postCommandState = await page.evaluate(() => ({
      localStorage: {
        activity: localStorage.getItem('current-activity'),
        lastCommand: localStorage.getItem('last-command')
      },
      url: window.location.href,
      handtermRef: window.handtermRef?.current ? 'exists' : 'missing'
    }));
    console.log('State after command:', postCommandState);

    // Reduce timeout since we now know the command isn't working
    await page.waitForFunction(() => {
      return window.location.href.includes('activity=edit');
    }, { timeout: 1000 }).catch(e => {
      console.log('Failed to transition to edit activity');
      throw e;
    });

    // Then verify the complete URL
    await expect(page).toHaveURL(/activity=edit\?key=_index\.md/, { timeout: 5000 });

    // Verify MonacoEditor is visible
    const editor = page.locator('.monaco-editor');
    await expect(editor).toBeVisible();
  });

  test('should navigate to edit activity with specific file', async ({ page }) => {
    // Set test content in localStorage
    await page.evaluate(() => {
      localStorage.setItem('edit-content', JSON.stringify({
        key: 'myfile.md',
        content: '# Test Content'
      }));
    });

    // Debug: Log before command execution
    console.log('Executing edit command with file...');
    await terminal.executeCommand('edit myfile.md');

    // Debug: Log after command execution
    console.log('Command executed, current URL:', page.url());

    // Wait for activity change first
    await page.waitForFunction(() => {
      return window.location.href.includes('activity=edit');
    }, { timeout: 5000 });

    // Then verify the complete URL
    await expect(page).toHaveURL(/activity=edit\?key=myfile\.md/, { timeout: 5000 });

    // Verify MonacoEditor is visible
    const editor = page.locator('.monaco-editor');
    await expect(editor).toBeVisible();

    // Verify content loaded
    const editorContent = await page.evaluate(() => {
      const editor = window.monacoEditor;
      if (!editor) {
        throw new Error('Monaco editor not found');
      }
      return editor.getValue();
    });
    expect(editorContent).toContain('# Test Content');
  });

  test('should show error for invalid command', async ({ page }) => {
    // Debug: Log before command execution
    console.log('Executing invalid command...');
    await terminal.executeCommand('editt');

    // Debug: Log terminal output
    const output = await terminal.getOutput();
    console.log('Terminal output:', output);

    // Wait for error message with retry
    const error = page.locator('.error-message');
    await expect(error).toBeVisible({ timeout: 5000 });
    await expect(error).toContainText('Edit command not recognized', { timeout: 5000 });
  });
});
