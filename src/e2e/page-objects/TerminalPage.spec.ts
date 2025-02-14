import { test, expect } from '@playwright/test';
import { TerminalPage } from './TerminalPage';

test.describe('TerminalPage', () => {
  let terminal: TerminalPage;

  test.beforeEach(async ({ page }) => {
    terminal = new TerminalPage(page);
    await terminal.goto();
  });

  test('completeTutorials should properly complete all tutorials', async ({ page }) => {
    // Initial state check
    const initialUrl = page.url();
    expect(initialUrl).toContain('activity=tutorial');

    // Execute completeTutorials
    await terminal.completeTutorials();

    // Verify tutorials are completed in localStorage
    const completedTutorials = await page.evaluate(() => {
      return localStorage.getItem('completed-tutorials');
    });
    expect(completedTutorials).not.toBeNull();

    // Verify we're not in tutorial mode
    const finalUrl = page.url();
    expect(finalUrl).not.toContain('activity=tutorial');
  });

  test('should be able to type and execute commands', async () => {
    await terminal.completeTutorials();
    await terminal.waitForPrompt();

    // Test the ability to type and execute a command
    await terminal.executeCommand('test-command');

    // Verify command was typed (we don't care about the response)
    const output = await terminal.getOutput();
    expect(output).toContain('test-command');
  });

  test('should be able to get terminal output', async () => {
    await terminal.completeTutorials();
    await terminal.waitForPrompt();

    // Type something that will definitely appear in output
    await terminal.executeCommand('echo test');

    // Verify we can get output
    const output = await terminal.getOutput();
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  test('should be able to wait for prompt', async () => {
    await terminal.completeTutorials();

    // Simply verify the method completes without throwing
    await terminal.waitForPrompt();

    // Additional verification that prompt is actually visible
    const promptVisible = await terminal.terminal.getByText('>').isVisible();
    expect(promptVisible).toBe(true);
  });

  test('should handle activity transitions', async ({ page }) => {
    // Start with completed tutorials
    await terminal.completeTutorials();
    await terminal.waitForPrompt();

    // Set initial activity state
    await page.evaluate(() => {
      localStorage.setItem('current-activity', 'terminal');
    });

    // Wait a bit for the application to process the localStorage change
    await page.waitForTimeout(100);

    // Verify initial state
    const initialActivity = await page.evaluate(() => {
      return localStorage.getItem('current-activity');
    });
    expect(initialActivity).toBe('terminal');

    // Execute a command that should stay in terminal mode
    await terminal.executeCommand('help');

    // Wait for transition and verify we stayed in terminal mode
    await terminal.waitForActivityTransition();

    const finalActivity = await page.evaluate(() => {
      return localStorage.getItem('current-activity');
    });
    expect(finalActivity).toBe('terminal');

    // Verify we can still interact with the terminal
    await terminal.waitForPrompt();
    const canTypeMore = await terminal.terminal.isEnabled();
    expect(canTypeMore).toBe(true);
  });

  test('should handle localStorage operations', async ({ page }) => {
    await terminal.completeTutorials();

    // Test setting content
    const testContent = { key: 'test.md', content: '# Test' };
    await page.evaluate((content) => {
      localStorage.setItem('edit-content', JSON.stringify(content));
    }, testContent);

    // Verify content was set
    const storedContent = await page.evaluate(() => {
      return localStorage.getItem('edit-content');
    });
    expect(JSON.parse(storedContent!)).toEqual(testContent);
  });

  test('should execute commands and verify UI updates', async ({ page }) => {
    await terminal.completeTutorials();
    await terminal.waitForPrompt();

    // Execute a command that should update the UI
    await terminal.executeCommand('help');

    // Verify command output appears in terminal
    const output = await terminal.getOutput();
    expect(output).toContain('help');

    // Verify UI remains responsive
    await terminal.waitForPrompt();
    const canTypeMore = await terminal.terminal.isEnabled();
    expect(canTypeMore).toBe(true);
  });
});
