import { type Page, type Locator, expect } from '@playwright/test';
import { allTutorialKeys } from '@handterm/types';

import { TERMINAL_CONSTANTS } from 'src/constants/terminal';
import type { Signal } from '@preact/signals-react';
import type { ActivityType, GamePhrase, IHandTermWrapperMethods, ActionType, ParsedCommand } from '@handterm/types';
import { TEST_CONFIG } from '../config';
import { setupBrowserWindow } from '../browser-setup/setupWindow';
import { type Terminal } from '@xterm/xterm';

// Extend Window interface for our signals and ref
declare global {
  interface Window {
    tutorialSignal: Signal<GamePhrase | null>;
    activitySignal: Signal<ActivityType>;
    handtermRef: React.RefObject<IHandTermWrapperMethods>;
    activityStateSignal: {
      value: {
        current: ActivityType;
        previous: ActivityType | null;
        transitionInProgress: boolean;
        tutorialCompleted: boolean;
      };
    };
    completedTutorialsSignal: {
      value: Set<string>;
    };
    TERMINAL_CONSTANTS: typeof TERMINAL_CONSTANTS;
    terminalInstance: Terminal// or more specific type from xterm.js
    setActivity: (activity: ActivityType) => void;
    setCompletedTutorial: (key: string) => void;
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

  constructor(page: Page) {
    this.page = page;
    this.terminal = page.locator('#xtermRef');
    this.output = page.locator('#output-container');
    this.tutorialMode = page.locator('.tutorial-component');
    this.gameMode = page.locator('#terminal-game');
    this.nextChars = page.locator('pre#next-chars');
  }

  async initialize(): Promise<void> {
    // Setup browser window environment first
    await setupBrowserWindow(this.page);

    // Verify window functions are properly exposed
    const verification = await this.page.evaluate(() => ({
      hasSetCompletedTutorial: typeof window.setCompletedTutorial === 'function',
      hasSetActivity: typeof window.setActivity === 'function',
      hasSignals: !!window.activityStateSignal
    }));

    if (!verification.hasSetCompletedTutorial) {
      throw new Error('Required window function setCompletedTutorial was not properly exposed');
    }
    if (!verification.hasSetActivity) {
      throw new Error('Required window function setActivity was not properly exposed');
    }
    if (!verification.hasSignals) {
      throw new Error('Required activity signal was not properly exposed');
    }

    // Navigate to the page and wait for terminal
    await this.page.goto(TEST_CONFIG.baseUrl);
    await this.waitForTerminal();
  }

  // NEW METHOD: checkHandtermWrapper
  public async checkHandtermWrapper(): Promise<void> {
    const handtermWrapper = await this.page.$('#handterm-wrapper');
    console.log('TerminalPage checkHandtermWrapper:', handtermWrapper);
  }

  public async terminalHasChildren(): Promise<boolean> {
    return await this.page.evaluate(() => {
      const terminal = document.querySelector('#xtermRef');
      const hasChildren = terminal ? terminal.children.length > 0 : false;
      return hasChildren;
    });
  }

  /**
   * Waits for the terminal to be ready
   */
  public async waitForTerminal(): Promise<void> {
    // Wait for application to load
    await this.page.waitForSelector('#handterm-wrapper', { state: 'attached', timeout: TEST_CONFIG.timeout.short });

    // Wait for terminal element
    const xtermRef = await this.page.$('#xtermRef');
    if (!xtermRef) {
      throw new Error('Terminal element (#xtermRef) not found');
    }

    // Check if #xtermRef is visible
    const isVisible = await xtermRef.isVisible();
    if (!isVisible) {
      throw new Error('Terminal element (#xtermRef) is not visible');
    }

    // Check if #xtermRef has children. Now using the new method.
    if (!await this.terminalHasChildren()) {
      throw new Error('Terminal element (#xtermRef) has no children');
    }
  }

  /**
   * Focuses the terminal
   */
  public async focus(): Promise<void> {
    await this.terminal.focus();
  }

  /**
   * Waits for activity transition to complete
   */
  private async waitForActivityTransition(timeout: number = 5000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const state = await this.page.evaluate(() => {
          return {
            activity: localStorage.getItem('activity'),
            url: window.location.href,
            tutorialVisible: !!document.querySelector('.tutorial-prompt'),
            handtermWrapper: document.querySelector('#handterm-wrapper')
          };
        });

        // If we're no longer in tutorial mode and have a valid wrapper, consider it success
        if (!state.tutorialVisible && state.handtermWrapper) {
          return;
        }

        // Short delay before next check
        await this.page.waitForTimeout(100);
      } catch (error) {
        console.error('Error checking activity transition:', error);
      }
    }

    throw new Error(`Activity transition timed out after ${timeout}ms`);
  }

  async waitForTutorialMode(timeout = 1000000): Promise<void> {
    try {
      await this.logNodeChildrenWithIds('div#handterm-wrapper');
      // Wait for tutorial component to be attached
      await this.page.waitForSelector('.tutorial-component', { state: 'attached', timeout });


      // Wait for tutorial content to be loaded (tutorial-prompt only appears when content is set)
      await this.page.waitForSelector('.tutorial-prompt', { state: 'visible', timeout });

      // Verify tutorial content is actually set
      const tutorialContent = await this.page.locator('.tutorial-prompt').textContent();
      if (!tutorialContent) {
        throw new Error('Tutorial content is empty');
      }
    } catch (error) {
      // Enhanced error logging: Log specific DOM elements and full page content on failure
      const html = await this.page.content();
      const tutorialComponent = await this.tutorialMode.evaluate(el => el?.outerHTML);
      const tutorialPrompt = await this.page.locator('.tutorial-prompt').evaluate(el => el?.outerHTML);
      console.log('[waitForTutorialMode] Error:', (error instanceof Error) ? error.message : 'Unknown error'); // Check if error is an instance of Error
      console.log('[waitForTutorialMode] Tutorial Component:', tutorialComponent);
      console.log('[waitForTutorialMode] Tutorial Prompt:', tutorialPrompt);
      console.log('[waitForTutorialMode] Full Page Content:', html);
      throw error;
    }
  }

  /**
   * Logs the tag name and id of all child nodes with IDs for a given node selector.
   * @param nodeSelector CSS selector for the node to inspect.
   */
  private async logNodeChildrenWithIds(nodeSelector: string, isDebug: boolean = false): Promise<void> {
    if (isDebug) return;
    try {
      const wrapperNodesWithIds = await this.page.evaluate(
        (selector) => {
          const wrapper = document.querySelector(selector);
          if (!wrapper) {
            return `${selector} not found`;
          }
          const elementsWithIds = Array.from(wrapper.querySelectorAll('*[id]'));
          return elementsWithIds.map((element) => ({
            tagName: element.tagName,
            id: element.id,
          }));
        },
        nodeSelector,
      );

      // Only print if we're in debug mode.
      if (isDebug) console.log(`[DOM Nodes with IDs in ${nodeSelector}]`, wrapperNodesWithIds);
    } catch (error) {
      console.error(`ERROR in logNodeChildrenWithIds for selector ${nodeSelector}:`, error);
    }
  }

  public async goto(): Promise<void> {
    await this.page.goto(TEST_CONFIG.baseUrl);
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
    await this.waitForTerminal();

    // Get the text from the terminal's active buffer
    const terminalText = await this.page.evaluate((promptString) => {
      const terminal = window.terminalInstance;
      if (!terminal) return '';

      // Get the current line from the buffer
      const buffer = terminal.buffer.active;
      const currentLine = buffer.getLine(buffer.cursorY);
      if (!currentLine) return '';

      const lineText = currentLine.translateToString();
      // Remove the prompt from the beginning of the line
      return lineText.substring(promptString.length).trimStart();
    }, this.prompt);

    return terminalText;
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
    await expect(this.nextChars).toHaveText(text, { timeout: TEST_CONFIG.timeout.long });
  }

  /**
   * Waits for the prompt to appear, indicating the terminal is ready
   */
  public async waitForPrompt(): Promise<void> {
    await this.terminal.getByText(this.prompt).last().waitFor();
  }


  /**
   * Clears the current command line using Ctrl+C
   */
  public async clearLine(): Promise<void> {
    await this.terminal.click();
    await this.page.keyboard.press('Control+C');
    await this.waitForPrompt();
  }

  public async getActivityMediator(): Promise<{
    isInGameMode: boolean;
    isInTutorial: boolean;
    isInEdit: boolean;
    isInNormal: boolean;
    checkTutorialProgress: (command: string | null) => void;
    heroAction: ActionType;
    zombie4Action: ActionType;
    handleCommandExecuted: (parsedCommand: ParsedCommand) => boolean;
    setHeroAction: React.Dispatch<React.SetStateAction<ActionType>>;
    setZombie4Action: React.Dispatch<React.SetStateAction<ActionType>>;
    checkGameProgress: (successPhrase: GamePhrase) => void;
    setActivity: (activity: ActivityType) => void;
  } | undefined> {
    return await this.page.evaluate(() => {
      return window.handtermRef?.current?.activityMediator;
    });
  }

  async completeTutorials(): Promise<void> {

    // Set completed tutorials in localStorage
    await this.page.evaluate((tutorials) => {
      localStorage.setItem('completed-tutorials', JSON.stringify(tutorials));
    }, allTutorialKeys);

    // Check if we're in tutorial mode
    const url = new URL(this.page.url());
    if (url.searchParams.get('activity') === 'tutorial') {
      await this.executeCommand('complete');

      // Wait for the tutorial prompt to disappear and terminal to be ready
      await this.waitForActivityTransition();
      await this.waitForPrompt();
    }
  }

  /**
   * Gets the actual terminal line content, including the prompt
   * @returns The full terminal line content
   */
  public async getActualTerminalLine(): Promise<string> {
    return await this.page.evaluate(() => {
      const terminal = window.terminalInstance;
      if (!terminal) return '';
      const buffer = terminal.buffer.active;
      const currentLine = buffer.getLine(buffer.cursorY);
      return currentLine ? currentLine.translateToString() : '';
    });
  }

  /**
   * Gets the full terminal content
   * @returns The entire text content of the terminal
   */
  public async getFullTerminalContent(): Promise<string> {
    return await this.terminal.innerText();
  }
}
