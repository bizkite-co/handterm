import { test, expect } from '@playwright/test';
import { TerminalPage } from '../page-objects/TerminalPage';
import { TEST_CONFIG } from '\'e2e/config\'';

test.describe('Terminal Visibility', () => {
  test('terminal element should be visible', async ({ page }) => {
    await page.goto(TEST_CONFIG.baseUrl);
    await page.waitForLoadState('domcontentloaded');
    const terminal = new TerminalPage(page);
    await terminal.waitForAppReady();
    await terminal.waitForTerminalContainer();
    // Check the container is attached and has child elements (Monaco renders inside)
    const hasChildren = await terminal.terminalHasChildren();
    await expect(hasChildren).toBe(true);
  });
  test('terminal element should have children', async ({ page }) => {
    await page.goto(TEST_CONFIG.baseUrl);
    await page.waitForLoadState('domcontentloaded');
    const terminal = new TerminalPage(page);
    await terminal.waitForAppReady();
    await terminal.waitForTerminalContainer();
    const hasChildren = await terminal.terminalHasChildren();
    await expect(hasChildren).toBe(true);
  })
});