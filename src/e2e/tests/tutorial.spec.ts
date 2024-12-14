import { test, expect } from '@playwright/test';
import { TerminalPage } from '../page-objects/TerminalPage';

let terminalPage: TerminalPage;

test.beforeEach(async ({ page }) => {
  terminalPage = new TerminalPage(page);

  // Clear localStorage to reset tutorial state
  await page.evaluate(() => {
    localStorage.clear();
    // Reload to ensure signals are reinitialized
    window.location.reload();
  });

  await terminalPage.goto();
});

test('should progress from tutorial to game mode after completing initial steps', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => console.log('Browser log:', msg.text()));

  // Given the user is in tutorial mode
  await expect(terminalPage.tutorialMode).toBeVisible();

  // When the user types "Enter"
  await terminalPage.pressEnter();
  await terminalPage.waitForPrompt();

  // Log tutorial state
  const tutorialText = await page.locator('.tutorial-component').textContent();
  console.log('Tutorial text after Enter:', tutorialText);

  // Type "fdsa" first time
  await terminalPage.typeKeys('fdsa');
  await terminalPage.pressEnter();
  await terminalPage.waitForPrompt();

  // Log tutorial state
  const tutorialText2 = await page.locator('.tutorial-component').textContent();
  console.log('Tutorial text after first fdsa:', tutorialText2);

  // Type "fdsa" second time with spaces
  await terminalPage.typeKeys('f d s a');
  await terminalPage.pressEnter();
  await terminalPage.waitForPrompt();

  // Log tutorial state
  const tutorialText3 = await page.locator('.tutorial-component').textContent();
  console.log('Tutorial text after f d s a:', tutorialText3);

  // And the user types "jkl;"
  await terminalPage.typeKeys('jkl;');
  await terminalPage.pressEnter();
  await terminalPage.waitForPrompt();

  // Log tutorial state and localStorage
  const tutorialText4 = await page.locator('.tutorial-component').textContent();
  console.log('Tutorial text after jkl;:', tutorialText4);

  const storage = await page.evaluate(() => {
    return {
      completedTutorials: localStorage.getItem('completed-tutorials'),
      allStorage: Object.entries(localStorage)
    };
  });
  console.log('LocalStorage state:', storage);

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
