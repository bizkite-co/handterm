// @ts-nocheck
import { test, expect, type Page } from '@playwright/test';
import { setupBrowserWindow } from './setupWindow';

test.describe('setupBrowserWindow', () => {
    test('should expose a simple function', async ({ page }) => {
        await setupBrowserWindow(page);
        const result = await page.evaluate(() => {
            return typeof window.myFunction === 'function';
        });
        expect(result).toBe(true);
    });
});