import { type Page, type Locator } from '@playwright/test';

export class TutorialPage {
  readonly page: Page;
  readonly tutorialMode: Locator;
  readonly gameMode: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use existing class for tutorial component
    this.tutorialMode = page.locator('.tutorial-component');
    // Use existing ID for game component
    this.gameMode = page.locator('#terminal-game');
  }

  async goto() {
    await this.page.goto('/');
  }

  async typeKeys(key: string) {
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
