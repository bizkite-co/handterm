import { test, expect } from '@playwright/test';

test.describe('MonacoTerminal Error Debugging', () => {
  test('should capture browser logs for InstantiationService disposed error', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        logs.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
      } else {
        logs.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
      }
    });
    page.on('pageerror', error => {
      logs.push(`[PAGEERROR] ${error.message}`);
    });

    await page.goto('http://localhost:5173/');

    // Wait for a few seconds to allow the component to render and potentially error
    await page.waitForTimeout(5000);

    console.log('Captured Browser Logs:');
    logs.forEach(log => console.log(log));

    // Assert that the error message is present in the logs
    expect(logs.some(log => log.includes('InstantiationService has been disposed'))).toBeTruthy();
  });
});