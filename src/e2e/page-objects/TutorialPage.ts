import { type Page, type Locator } from '@playwright/test';

export class TutorialPage {
  readonly page: Page;
  readonly tutorialMode: Locator;
  readonly gameMode: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tutorialMode = page.getByTestId('tutorial-component');
    this.gameMode = page.getByTestId('game-mode');
  }

  async goto() {
    await this.page.goto('/');
  }

  async typeKey(key: string) {
    await this.page.keyboard.type(key);
  }

  async pressEnter() {
    await this.page.keyboard.press('Enter');
  }

  async isTutorialMode(): Promise<boolean> {
    return await this.tutorialMode.isVisible();
  }

  async isGameMode(): Promise<boolean> {
    return await this.gameMode.isVisible();
  }
}
