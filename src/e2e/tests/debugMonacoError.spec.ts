import { test, expect } from '@playwright/test';

test.describe('Monaco InstantiationService Debugging', () => {
  test('should capture browser logs and screenshot for InstantiationService disposed error', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(`[CONSOLE - ${msg.type().toUpperCase()}] ${msg.text()}`);
    });
    page.on('pageerror', error => {
      logs.push(`[PAGEERROR] ${error.message}`);
    });

    await page.goto('http://localhost:5173/');

    // Wait for a few seconds to allow the component to render and potentially error
    await page.waitForTimeout(5000);

    // Capture a screenshot
    await page.screenshot({ path: 'test-results/monaco-error-screenshot.png' });

    console.log('--- Captured Browser Logs ---');
    logs.forEach(log => console.log(log));
    console.log('-----------------------------');

    // Assert that the error message is present in the logs
    expect(logs.some(log => log.includes('InstantiationService has been disposed'))).toBeTruthy();
  });
});