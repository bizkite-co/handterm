import { type Page, type Locator } from '@playwright/test';
import { TERMINAL_CONSTANTS } from 'src/constants/terminal';

export class TerminalPage {
  readonly page: Page;
  readonly terminal: Locator;
  readonly output: Locator;
  readonly tutorialMode: Locator;
  readonly gameMode: Locator;
  private readonly prompt = TERMINAL_CONSTANTS.PROMPT;

  constructor(page: Page) {
    this.page = page;
    this.terminal = page.locator('#xtermRef');
    this.output = page.locator('#output-container');
    this.tutorialMode = page.locator('.tutorial-component');
    this.gameMode = page.locator('#terminal-game');
  }

  async goto() {
    await this.page.goto('/');
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
    const text = await this.terminal.textContent() || '';
    const promptIndex = text.lastIndexOf(this.prompt);
    return promptIndex >= 0 ? text.substring(promptIndex + this.prompt.length).trim() : '';
  }

  /**
   * Waits for specific text to appear in the output
   * @param text The text to wait for
   */
  async waitForOutput(text: string) {
    await this.output.getByText(text).waitFor();
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
