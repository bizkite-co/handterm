import { test, expect } from '@playwright/test';
import '../playwright.setup';
import { TerminalPage } from '../page-objects/TerminalPage';
import { TEST_CONFIG } from '../config';

const TIMEOUTS = {
  short: TEST_CONFIG.timeout.short,
  medium: TEST_CONFIG.timeout.medium,
  transition: TEST_CONFIG.timeout.transition
} as const;

test('should complete jkl; tutorial', async ({ context, page }) => {
  // Set up initial state
  await context.addInitScript(() => {
    // Set up localStorage as if \r and fdsa tutorials were completed
    window.localStorage.setItem('completed-tutorials', JSON.stringify(['\r', 'fdsa']));
    window.localStorage.setItem('tutorial-state', JSON.stringify({ currentStep: 0 }));
  });

  // Initialize page
  await page.goto(TEST_CONFIG.baseUrl);
  const terminalPage = new TerminalPage(page);

  // Wait for application
  await page.waitForSelector('#handterm-wrapper', {
    state: 'attached',
    timeout: TIMEOUTS.medium
  });

  // Wait for tutorial mode
  await terminalPage.waitForTutorialMode();
  await expect(terminalPage.tutorialMode).toBeVisible({
    timeout: TIMEOUTS.short
  });

  // Complete jkl; tutorial
  await terminalPage.focus();
  await terminalPage.typeKeys('jkl;');
  await terminalPage.pressEnter();
  await terminalPage.waitForPrompt();

  // Verify only this tutorial was completed
  const completed = await page.evaluate(() => {
    const stored = localStorage.getItem('completed-tutorials');
    return stored ? JSON.parse(stored) : [];
  });
  expect(completed).toContain('\r');   // Previous state preserved
  expect(completed).toContain('fdsa'); // Previous state preserved
  expect(completed).toContain('jkl;'); // Our state added
  expect(completed.length).toBe(3);    // No other state
});