import { test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  console.log('[Node] Setting up page');

  // Add console listener before the script runs
  page.on('console', msg => {
    console.log(`[Browser->Node] ${msg.text()}`);
  });

  console.log('[Node] Adding init script');
  await page.addInitScript(() => {
    console.log('[Browser] Init script is running');
    (window as unknown as { testFunction: () => string }).testFunction = () => {
      console.log('[Browser] testFunction was called');
      return "Hello from Playwright!";
    };
    console.log('[Browser] Init script finished');
  });
  console.log('[Node] Init script added');
});
