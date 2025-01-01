import { test, expect } from '@playwright/test';

import { TerminalPage } from '../page-objects/TerminalPage';

let terminalPage: TerminalPage;

import { TEST_CONFIG } from '../config';

test.beforeEach(async ({ page }) => {
  test.setTimeout(TEST_CONFIG.timeout.long);

  // Initialize page first
  await page.goto(TEST_CONFIG.baseUrl);

  terminalPage = new TerminalPage(page);

  // Capture console logs
  page.on('console', msg => {
    console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
  });

  // Capture network requests
  page.on('requestfailed', request => {
    console.log(`[Network] Request failed: ${request.url()} - ${request.failure()?.errorText}`);
  });

  // Wait for application to load
  try {
    await page.waitForSelector('#handterm-wrapper', { state: 'attached', timeout: TEST_CONFIG.timeout.medium });
  } catch (error) {
    // If timeout occurs, capture the page content for debugging
    const html = await page.content();
    console.log('[Page Content]', html);
    throw error;
  }

  await terminalPage.goto();
});

test('should progress from tutorial to game mode after completing initial steps', async ({ page: _page }) => {
  // Given the user is in tutorial mode
  await expect(terminalPage.tutorialMode).toBeVisible();

  // When the user types "Enter"
  await terminalPage.pressEnter();
  await terminalPage.waitForPrompt();

  // Type "fdsa"
  await terminalPage.typeKeys('fdsa');
  await terminalPage.pressEnter();
  await terminalPage.waitForPrompt();

  // Type "jkl;" to complete tutorial
  await terminalPage.typeKeys('jkl;');
  await terminalPage.pressEnter();
  await terminalPage.waitForPrompt();

  // Then the Activity should change from Tutorial to Game
  await expect(terminalPage.tutorialMode).not.toBeVisible({ timeout: 10000 });
  await expect(terminalPage.gameMode).toBeVisible({ timeout: 10000 });

  // Wait for and verify the game phrase
  await terminalPage.waitForNextChars('all sad lads ask dad; alas fads fall');

  // When the user types "all sad lads ask dad; alas fads fall"
  await terminalPage.typeKeys('all sad lads ask dad; alas fads fall');
  await terminalPage.pressEnter();
  await terminalPage.waitForPrompt();

  // Then the user is returned to the tutorial
  await expect(terminalPage.gameMode).not.toBeVisible({ timeout: 10000 });
  await expect(terminalPage.tutorialMode).toBeVisible({ timeout: 10000 });
});

test('should start in tutorial mode with clean state', async () => {
  // This test will start fresh because of new context
  await expect(terminalPage.tutorialMode).toBeVisible();
  await expect(terminalPage.gameMode).not.toBeVisible();
});
