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

    // Verify tutorials are completed
    const completedTutorials = await page.evaluate(() => {
      return localStorage.getItem('completed-tutorials');
    });
    expect(completedTutorials).not.toBeNull();

    // Verify we're not in tutorial mode
    const finalUrl = page.url();
    expect(finalUrl).not.toContain('activity=tutorial');

    // Log state for debugging
    console.log('Final URL:', finalUrl);
    console.log('Completed Tutorials:', completedTutorials);
  });

  test('should execute commands and return output', async ({ page }) => {
    await terminal.completeTutorials();
    await terminal.waitForPrompt();

    // Execute a simple command
    await terminal.executeCommand('help');
    const output = await terminal.getOutput();
    expect(output).toContain('Available commands:');
  });

  test('should handle command input correctly', async ({ page }) => {
    await terminal.completeTutorials();
    await terminal.waitForPrompt();

    // Test command input
    await terminal.executeCommand('invalid-command');
    const output = await terminal.getOutput();
    expect(output).toContain('Command not found');
  });

  test('should maintain command history', async ({ page }) => {
    await terminal.completeTutorials();
    await terminal.waitForPrompt();

    // Execute multiple commands
    await terminal.executeCommand('help');
    await terminal.executeCommand('clear');

    // Verify history through localStorage
    const history = await page.evaluate(() => {
      return localStorage.getItem('command-history');
    });
    expect(history).not.toBeNull();
    const parsedHistory = JSON.parse(history || '[]');
    expect(parsedHistory).toContain('help');
    expect(parsedHistory).toContain('clear');
  });

  test('should properly handle terminal state transitions', async ({ page }) => {
    await terminal.completeTutorials();
    await terminal.waitForPrompt();

    // Execute a command that changes terminal state
    await terminal.executeCommand('edit');

    // Verify terminal state change
    const terminalState = await page.evaluate(() => {
      return {
        url: window.location.href,
        localStorage: {
          activity: localStorage.getItem('current-activity'),
          lastCommand: localStorage.getItem('last-command')
        }
      };
    });

    console.log('Terminal state after edit command:', terminalState);
    expect(terminalState.localStorage.lastCommand).toBe('edit');
  });
});
