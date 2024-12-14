import { type Page, type Locator, expect } from '@playwright/test';
import { TERMINAL_CONSTANTS } from 'src/constants/terminal';

export class TerminalPage {
  readonly page: Page;
  readonly terminal: Locator;
  readonly output: Locator;
  readonly tutorialMode: Locator;
  readonly gameMode: Locator;
  readonly nextChars: Locator;
  private readonly prompt = TERMINAL_CONSTANTS.PROMPT;

  constructor(page: Page) {
    this.page = page;
    this.terminal = page.locator('#xtermRef');
    this.output = page.locator('#output-container');
    this.tutorialMode = page.locator('.tutorial-component');
    this.gameMode = page.locator('#terminal-game');
    this.nextChars = page.locator('pre#next-chars');
  }

  async goto() {
    await this.page.goto('/');
    // Wait for the signal to be exposed
    await this.page.waitForFunction(() => 'commandLineSignal' in window);
  }

  /**
   * Types a command into the terminal
   * @param command The command to type
   */
  async typeCommand(command: string) {
    await this.terminal.click();
    await this.page.keyboard.type(command);
  }

  /**
   * Types a sequence of keys without executing a command
   * @param keys The keys to type
   */
  async typeKeys(keys: string) {
    await this.terminal.click();
    await this.page.keyboard.type(keys);
  }

  /**
   * Presses the Enter key
   */
  async pressEnter() {
    await this.page.keyboard.press('Enter');
  }

  /**
   * Executes a command by typing it and pressing Enter
   * @param command The command to execute
   */
  async executeCommand(command: string) {
    await this.typeCommand(command);
    await this.pressEnter();
  }

  /**
   * Gets the current terminal output
   * @returns The text content of the output container
   */
  async getOutput(): Promise<string> {
    return await this.output.textContent() || '';
  }

  /**
   * Gets the current command line text (without the prompt)
   * @returns The current command line text
   */
  async getCurrentCommand(): Promise<string> {
    // Wait for the signal to be available
    await this.page.waitForFunction(() => 'commandLineSignal' in window);

    // Get the value from commandLineSignal
    const commandLine = await this.page.evaluate(() => {
      return (window as unknown as { commandLineSignal: { value: string } }).commandLineSignal.value;
    });

    return commandLine || '';
  }

  /**
   * Waits for specific text to appear in the output
   * @param text The text to wait for
   */
  async waitForOutput(text: string) {
    await this.output.getByText(text, { exact: false }).waitFor();
  }

  /**
   * Waits for specific text to appear in the next chars display
   * @param text The text to wait for
   */
  async waitForNextChars(text: string) {
    // First wait for the element to exist
    await this.nextChars.waitFor({ state: 'attached' });

    // Log current text for debugging
    const currentText = await this.nextChars.textContent();
    console.log('Current next-chars text:', currentText);

    // Then wait for the specific text
    await this.nextChars.waitFor({ state: 'visible' });
    await expect(this.nextChars).toHaveText(text, { timeout: 10000 });
  }

  /**
   * Waits for the prompt to appear, indicating the terminal is ready
   */
  async waitForPrompt() {
    await this.terminal.getByText(this.prompt).last().waitFor();
  }

  /**
   * Focuses the terminal
   */
  async focus() {
    await this.terminal.click();
  }

  /**
   * Clears the current command line using Ctrl+C
   */
  async clearLine() {
    await this.terminal.click();
    await this.page.keyboard.press('Control+C');
    await this.waitForPrompt();
  }
}
