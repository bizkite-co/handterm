import { test, expect } from '@playwright/test';
import { TutorialPage } from '../page-objects/TutorialPage';

test.describe('Tutorial Progression', () => {
  let tutorialPage: TutorialPage;

  test.beforeEach(async ({ page }) => {
    tutorialPage = new TutorialPage(page);
    await tutorialPage.goto();
  });

  test('should progress from tutorial to game mode after completing initial steps', async () => {
    // Given the user is in tutorial mode
    await expect(tutorialPage.tutorialMode).toBeVisible();

    // When the user types the required sequences
    await tutorialPage.pressEnter();
    await tutorialPage.pressEnter();
    await tutorialPage.pressEnter();
    await tutorialPage.pressEnter();
    await tutorialPage.typeKey('fdsa');
    await tutorialPage.pressEnter();
    await tutorialPage.typeKey('jkl;');
    await tutorialPage.pressEnter();

    // Then the activity should change to game mode
    await expect(tutorialPage.gameMode).toBeVisible();
    await expect(tutorialPage.tutorialMode).not.toBeVisible();
  });

  // Example of another test in the same suite
  test('should start in tutorial mode with clean state', async () => {
    // This test will start fresh because of new context
    await expect(tutorialPage.tutorialMode).toBeVisible();
    await expect(tutorialPage.gameMode).not.toBeVisible();
  });
});
