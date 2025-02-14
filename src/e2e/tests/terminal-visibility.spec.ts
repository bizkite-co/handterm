import { test, expect } from '@playwright/test';
import { TerminalPage } from '../page-objects/TerminalPage';

test.describe('Terminal Visibility', () => {
  test('terminal element should be visible', async ({ page }) => {
    const terminal = new TerminalPage(page);

    // Wrap the waitForTerminal call in an expect().not.toThrow()
    await expect(async () => {
      await terminal.waitForTerminal();
    }).not.toThrow();

    // Use the terminal page object for the assertion
    expect(terminal.terminal).toBeVisible();
  });
  test('terminal element should have children', async ({ page }) => {
    const terminal = new TerminalPage(page);
    await terminal.waitForTerminal();
    const hasChildren = await terminal.terminalHasChildren();
    await expect(hasChildren).toBe(true);
  })
});