import { test, expect } from '@playwright/test';
import { TerminalPage } from '../page-objects/TerminalPage';

let terminalPage: TerminalPage;

test.beforeEach(async ({ page }) => {
  terminalPage = new TerminalPage(page);
  await terminalPage.goto();
});

test('should progress from tutorial to game mode after completing initial steps', async () => {
  // Given the user is in tutorial mode
  await expect(terminalPage.tutorialMode).toBeVisible();

  // Given the user is in the tutorial mode
  // When the user types "Enter"
  await terminalPage.pressEnter();

  // And the user types "fdsa"
  await terminalPage.typeKeys('fdsa');
  await terminalPage.pressEnter();

  // And the user types "jkl;"
  await terminalPage.typeKeys('jkl;');
  await terminalPage.pressEnter();

  // Then the Activity should change from Tutorial to Game
  await expect(terminalPage.gameMode).toBeVisible();
  await expect(terminalPage.tutorialMode).not.toBeVisible();

  // And the user is presented with a Game phrase
  // When the user types "all sad lads ask dad; alas fads fall"
  await terminalPage.typeKeys('all sad lads ask dad; alas fads fall');

  // Then the user is returned to the tutorial
  await expect(terminalPage.tutorialMode).toBeVisible();
  await expect(terminalPage.gameMode).not.toBeVisible();
});

test('should start in tutorial mode with clean state', async () => {
  // This test will start fresh because of new context
  await expect(terminalPage.tutorialMode).toBeVisible();
  await expect(terminalPage.gameMode).not.toBeVisible();
});
