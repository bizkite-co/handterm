import { test, expect } from '@playwright/test';

import { TerminalPage } from '../page-objects/TerminalPage';

let terminalPage: TerminalPage;

test.beforeEach(async ({ page }) => {
  test.setTimeout(120000);
  terminalPage = new TerminalPage(page);

  // Clear localStorage using a command
  await terminalPage.executeCommand('clear');

  await terminalPage.goto();
});

test('should progress from tutorial to game mode after completing initial steps', async ({ page: _page }) => {
  // Given the user is in tutorial mode
  await expect(terminalPage.tutorialMode).toBeVisible();

  // When the user types "Enter"
  await terminalPage.pressEnter();
  await terminalPage.waitForPrompt();

  // Type "fdsa" first time
  await terminalPage.typeKeys('fdsa');
  await terminalPage.pressEnter();
  await terminalPage.waitForPrompt();

  // Type "fdsa" second time with spaces
  await terminalPage.typeKeys('f d s a');
  await terminalPage.pressEnter();
  await terminalPage.waitForPrompt();

  // And the user types "jkl;"
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
