import { test } from '@playwright/test';
import { TEST_CONFIG } from '../config';
import { TerminalPage } from '../page-objects/TerminalPage';

test.describe('Terminal Visibility', () => {
  test('terminal element should be visible', async ({ page }) => {
    await page.goto(TEST_CONFIG.baseUrl);

    const terminal = new TerminalPage(page);

    await page.waitForSelector('#handterm-wrapper', { state: 'attached', timeout: TEST_CONFIG.timeout.short });

    // Wait for terminal element
    const xtermRef = await page.$('#xtermRef');
    if (!xtermRef) {
      throw new Error('Terminal element (#xtermRef) not found');
    }
    await terminal.waitForTerminal();

    // Check if #xtermRef is visible
    const isVisible = await xtermRef.isVisible();
    if (!isVisible) {
      throw new Error('Terminal element (#xtermRef) is not visible');
    }

    // Check if #xtermRef has children
    const hasChildren = await page.evaluate(() => {
      const terminal = document.querySelector('#xtermRef');
      return terminal ? terminal.children.length > 0 : false;
    });

    if (!hasChildren) {
      throw new Error('Terminal element (#xtermRef) has no children');
    }

  });
});