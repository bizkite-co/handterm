import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from '../config';

test.describe('Terminal Visibility', () => {
  test('terminal element should be visible', async ({ page }) => {
    await page.goto(TEST_CONFIG.baseUrl);

    // Wait for the handterm wrapper to be attached
    await page.waitForSelector('#handterm-wrapper', { state: 'attached' });

    // Wait for isTerminalReady to be true in the component
    await page.waitForFunction(() => {
      return (window as any).isTerminalReady === true;
    });

    // Check if #xtermRef exists
    const xtermRef = await page.$('#xtermRef');
    expect(xtermRef).not.toBeNull();

    // Check if #xtermRef is visible
    const isVisible = await xtermRef?.isVisible();
    expect(isVisible).toBe(true);

    // Check if #xtermRef has children
    const hasChildren = await page.evaluate(() => {
      const terminal = document.querySelector('#xtermRef');
      return terminal ? terminal.children.length > 0 : false;
    });
    expect(hasChildren).toBe(true);
  });
});