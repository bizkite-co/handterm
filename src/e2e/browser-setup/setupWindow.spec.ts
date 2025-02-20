import { test, expect, type Page } from '@playwright/test';
import { setupBrowserWindow } from './setupWindow';

test.describe('setupBrowserWindow', () => {
  test('should expose a simple function', async ({ page }) => {
    await page.exposeFunction('testFunction', () => 'test successful');
    const result = await page.evaluate(() => (window as any).testFunction());
    expect(result).toBe('test successful');
  });
});