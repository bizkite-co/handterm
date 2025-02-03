import { type Page, type Locator, expect } from '@playwright/test';

import { TERMINAL_CONSTANTS } from 'src/constants/terminal';
import type { Signal } from '@preact/signals-react';
import type { ActivityType, GamePhrase } from '@handterm/types';
import { TEST_CONFIG } from '../config';

// Extend Window interface for our signals
declare global {
  interface Window {
    tutorialSignal: Signal<GamePhrase | null>;
    activitySignal: Signal<ActivityType>;
  }
}

export class TerminalPage {
  readonly page: Page;
  readonly terminal: Locator;
  readonly output: Locator;
  readonly tutorialMode: Locator;
  readonly gameMode: Locator;
  readonly nextChars: Locator;
  private readonly prompt = TERMINAL_CONSTANTS.PROMPT;

  async waitForActivityTransition(timeout = 10000): Promise<void> {
    try {
      await this.page.waitForSelector('#terminal-game', { state: 'visible', timeout });
      await this.page.waitForSelector('.tutorial-component', { state: 'hidden', timeout });
    } catch (error) {
      const gameVisible = await this.gameMode.isVisible();
      const tutorialVisible = await this.tutorialMode.isVisible();
      console.log('Activity transition failed. Current state:', { gameVisible, tutorialVisible });
      throw error;
    }
  }

  async waitForTutorialMode(timeout = 10000): Promise<void> {
    try {
      // Wait for tutorial component to be attached
      await this.page.waitForSelector('.tutorial-component', { state: 'attached', timeout });

      // Wait for tutorial content to be loaded (tutorial-prompt only appears when content is set)
      await this.page.waitForSelector('.tutorial-prompt', { state: 'visible', timeout });

      // Get current tutorial state for debugging
      const tutorialState = await this.page.evaluate(() => ({
        tutorialSignal: window.tutorialSignal?.value,
        activitySignal: window.activitySignal?.value,
        completedTutorials: localStorage.getItem('completed-tutorials'),
        tutorialState: localStorage.getItem('tutorial-state')
      }));

      console.log('[Tutorial State]', tutorialState);

      // Verify tutorial content is actually set
      const tutorialContent = await this.page.locator('.tutorial-prompt').textContent();
      if (!tutorialContent) {
        throw new Error('Tutorial content is empty');
      }
    } catch (error) {
      // Log the current page state for debugging
      const html = await this.page.content();
      console.log('[Page Content]', html);
      throw error;
    }
  }

  constructor(page: Page) {
    this.page = page;
    this.terminal = page.locator('#xtermRef');
    this.output = page.locator('#output-container');
    this.tutorialMode = page.locator('.tutorial-component');
    this.gameMode = page.locator('#terminal-game');
    this.nextChars = page.locator('pre#next-chars');
    return this;
  }

  public async goto(): Promise<void> {
    await this.page.goto(`${TEST_CONFIG.baseUrl}/`);
    // Wait for the signal to be exposed
    await this.page.waitForFunction(() => 'commandLineSignal' in window, { timeout: TEST_CONFIG.timeout.medium });
    await this.waitForTerminal();
    await this.waitForPrompt();
  }

  /**
   * Types a command into the terminal
   * @param command The command to type
   */
  public async typeCommand(command: string): Promise<void> {
    await this.waitForTerminal();
    await this.terminal.click();
    await this.page.keyboard.type(command);
  }

  /**
   * Types a sequence of keys without executing a command
   * @param keys The keys to type
   */
  public async typeKeys(keys: string): Promise<void> {
    await this.waitForTerminal();
    await this.terminal.click();
    await this.page.keyboard.type(keys);
  }

  /**
   * Presses the Enter key
   */
  public async pressEnter(): Promise<void> {
    await this.waitForTerminal();
    await this.page.keyboard.press('Enter');
  }

  /**
   * Executes a command by typing it and pressing Enter
   * @param command The command to execute
   */
  public async executeCommand(command: string): Promise<void> {
    await this.waitForTerminal();
    await this.typeCommand(command);
    await this.pressEnter();
  }

  /**
   * Gets the current terminal output
   * @returns The text content of the output container
   */
  public async getOutput(): Promise<string> {
    return await this.output.textContent() ?? '';
  }

  /**
   * Gets the current command line text (without the prompt)
   * @returns The current command line text
   */
  public async getCurrentCommand(): Promise<string> {
    // Wait for the signal to be available
    await this.page.waitForFunction(() => 'commandLineSignal' in window);

    // Get the value from commandLineSignal
    const commandLine = await this.page.evaluate(() => {
      return (window as unknown as { commandLineSignal: { value: string } }).commandLineSignal.value;
    });

    return commandLine ?? '';
  }

  /**
   * Waits for specific text to appear in the output
   * @param text The text to wait for
   */
  public async waitForOutput(text: string): Promise<void> {
    await this.output.getByText(text, { exact: false }).waitFor();
  }

  /**
   * Waits for specific text to appear in the next chars display
   * @param text The text to wait for
   */
  public async waitForNextChars(text: string): Promise<void> {
    // First wait for the element to exist
    await this.nextChars.waitFor({ state: 'attached' });

    // Then wait for the specific text
    await this.nextChars.waitFor({ state: 'visible' });
    await expect(this.nextChars).toHaveText(text, { timeout: 10000 });
  }

  /**
   * Waits for the prompt to appear, indicating the terminal is ready
   */
  public async waitForPrompt(): Promise<void> {
    await this.terminal.getByText(this.prompt).last().waitFor();
  }

  /**
   * Waits for the terminal to be ready
   */
  public async waitForTerminal(): Promise<void> {
    // Wait for application to load
    await this.page.waitForSelector('#handterm-wrapper', { state: 'attached', timeout: TEST_CONFIG.timeout.long });

    // Wait for terminal element
    await this.page.waitForSelector('#xtermRef', { state: 'attached', timeout: TEST_CONFIG.timeout.medium });

    // Wait for xterm.js to be loaded and initialized
    await this.page.waitForFunction(() => {
      const term = document.querySelector('#xtermRef');
      if (term == null) return false;
      const screen = term.querySelector('.xterm-screen');
      return term.querySelector('.xterm-viewport') !== null &&
        screen !== null &&
        screen.childElementCount > 0;
    }, { timeout: TEST_CONFIG.timeout.medium });

    // Wait for terminal to be visible and interactive
    await this.terminal.waitFor({ state: 'visible', timeout: TEST_CONFIG.timeout.medium });

    // Wait for terminal to be ready for interaction and focused
    await this.page.waitForFunction(() => {
      const term = document.querySelector('#xtermRef');
      if (term == null) return false;
      const screen = term.querySelector('.xterm-screen');
      if (screen == null) return false;
      const viewport = term.querySelector('.xterm-viewport');
      if (viewport == null) return false;
      return screen.childElementCount > 0;
    }, { timeout: TEST_CONFIG.timeout.medium });

    // Focus the terminal
    await this.terminal.click();
  }

  /**
   * Focuses the terminal
   */
  public async focus(): Promise<void> {
    await this.terminal.click();
  }

  /**
   * Clears the current command line using Ctrl+C
   */
  public async clearLine(): Promise<void> {
    await this.terminal.click();
    await this.page.keyboard.press('Control+C');
    await this.waitForPrompt();
  }
}
