import { type Page, type Locator, expect } from '@playwright/test';
import { allTutorialKeys } from '@handterm/types';

import { TERMINAL_CONSTANTS } from 'src/constants/terminal';
import type { Signal } from '@preact/signals-react';
// Remove unused import of parseLocation from utils
// import { parseLocation } from '../../utils/navigationUtils';
import type { ActivityType as ActivityTypeEnum, GamePhrase, IHandTermWrapperMethods, ActionType, ParsedCommand } from '@handterm/types';
import { TEST_CONFIG } from '../config';
import { setupBrowserWindow } from '../browser-setup/setupWindow';
import { type Terminal } from '@xterm/xterm';


// REMOVED declare global block - types are now in packages/types/src/window.ts

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
    }));

    if (!verification.hasSetCompletedTutorial) {
      throw new Error('Required window function setCompletedTutorial was not properly exposed');
    }

    // UPDATED: Wait for the full app to be ready
    await this.waitForAppReady();

    // Now proceed with waiting for terminal elements
    await this.waitForTerminalContainer();
    await this.waitForPrompt();
  }

  // UPDATED METHOD: Wait for app readiness signal
  async waitForAppReady(timeout: number = TEST_CONFIG.timeout.medium): Promise<void> {
    try {
      // Wait for the flag set in App.tsx's useEffect
      await this.page.waitForFunction(() => (window as any).appReady === true, null, { timeout });
    } catch (error) {
      console.error('Timeout waiting for window.appReady flag.');
      throw new Error(`Timeout waiting for app readiness signal after ${timeout}ms`);
    }
  }

  // REMOVED waitForCommandsRegistered method as it's replaced by waitForAppReady

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
   * Waits for the main terminal container elements to be ready.
   * Does NOT guarantee the prompt is visible yet.
   */
  public async waitForTerminalContainer(): Promise<void> {
    // Wait for application wrapper to load
    // Increased timeout slightly for initial load robustness
    await this.page.waitForSelector('#handterm-wrapper', { state: 'attached', timeout: TEST_CONFIG.timeout.medium });

    // Wait for terminal element container
    const xtermRef = await this.page.$('#xtermRef');
    if (!xtermRef) {
      throw new Error('Terminal element (#xtermRef) not found');
    }

    // Check if #xtermRef is visible
    const isVisible = await xtermRef.isVisible();
    if (!isVisible) {
      throw new Error('Terminal element (#xtermRef) is not visible');
    }

    // Check if #xtermRef has children.
    if (!await this.terminalHasChildren()) {
      // Add a small delay and retry once, sometimes children take a moment
      await this.page.waitForTimeout(200);
      if (!await this.terminalHasChildren()) {
        throw new Error('Terminal element (#xtermRef) has no children after retry');
      }
    }
  }

  /**
   * Focuses the terminal
   */
  public async focus(): Promise<void> {
    await this.waitForPrompt(); // Ensure ready before focus
    await this.terminal.click();
  }

  /**
   * Waits for activity transition to complete
   */
  async waitForActivityTransition(timeout: number = 5000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const state = await this.page.evaluate(() => {
          // --- Injected Definitions Start ---
          const ActivityType = {
            NORMAL: 'normal',
            EDIT: 'edit',
            GITHUB: 'github',
            TREE: 'tree',
            TUTORIAL: 'tutorial',
            GAME: 'game'
          } as const;
          type ActivityType = typeof ActivityType[keyof typeof ActivityType];

          function parseActivityType(activityString: string): ActivityType {
            const normalizedActivity = (activityString ?? '').toUpperCase();
            const activity = (ActivityType as any)[normalizedActivity]; // Use any for browser context simplicity
            return activity ?? ActivityType.NORMAL;
          }

          type ParsedLocation = {
            activityKey: ActivityType;
            contentKey?: string | null;
            groupKey?: string | null;
            clearParams?: boolean;
          };

          function parseLocation(location: string = window.location.toString()): ParsedLocation {
            const urlParams = new URL(location);
            return {
              activityKey: parseActivityType(urlParams.searchParams.get('activity') ?? ''),
              contentKey: decodeURIComponent(urlParams.searchParams.get('key') ?? ''),
              groupKey: urlParams.searchParams.get('group') ?? null,
              clearParams: urlParams.searchParams.has('clearParams')
            };
          }
          // --- Injected Definitions End ---

          const url = window.location.href;
          const parsedLocation = parseLocation(url); // Use the injected function
          return {
            activity: parsedLocation.activityKey,
            url: url,
            tutorialVisible: !!document.querySelector('.tutorial-prompt'),
            handtermWrapper: document.querySelector('#handterm-wrapper'),
          };
        });

        // If we're no longer in tutorial mode and have a valid wrapper, consider it success
        if (!state.tutorialVisible && state.handtermWrapper) {
          // Also ensure the terminal prompt is back after transition
          await this.waitForPrompt();
          return;
        }

        // Short delay before next check
        await this.page.waitForTimeout(100);
      } catch (error) {
        // Ignore prompt wait errors during transition check, focus on state change
        if (!(error instanceof Error && error.message.includes('waitForPrompt'))) {
           console.error('Error checking activity transition:', error);
        }
        await this.page.waitForTimeout(100); // Ensure delay even on error
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
    // initialize() is called in beforeEach, which now waits for appReady and prompt
    // No need to duplicate waits here
  }

  /**
   * Types a command into the terminal
   * @param command The command to type
   */
  public async typeCommand(command: string): Promise<void> {
    await this.waitForPrompt(); // Ensure prompt is ready before typing
    await this.terminal.click(); // Click to ensure focus
    await this.page.keyboard.type(command);
  }

  /**
   * Types a sequence of keys without executing a command
   * @param keys The keys to type
   */
  public async typeKeys(keys: string): Promise<void> {
    await this.waitForPrompt(); // Ensure prompt is ready before typing
    await this.terminal.click(); // Click to ensure focus
    await this.page.keyboard.type(keys);
  }

  /**
   * Presses the Enter key
   */
  public async pressEnter(): Promise<void> {
    await this.waitForPrompt(); // Ensure prompt is ready before pressing Enter
    await this.page.keyboard.press('Enter');
  }

  /**
   * Executes a command by typing it and pressing Enter.
   * NOTE: This method does NOT wait for the command to finish processing.
   * Test cases should add appropriate waits (e.g., waitForOutput, waitForURL, waitForPrompt)
   * after calling this method based on the expected command outcome.
   * @param command The command to execute
   */
  public async executeCommand(command: string): Promise<void> {
    await this.typeCommand(command); // This now waits for prompt before typing
    await this.pressEnter(); // This now waits for prompt before pressing Enter
  }

  /**
   * Gets the current terminal output from the dedicated output container.
   * May not include the most recent command's output if it hasn't rendered yet.
   * @returns The text content of the output container
   */
  public async getOutput(): Promise<string> {
    // Wait for the container itself to be present
    await this.output.waitFor({ state: 'attached', timeout: TEST_CONFIG.timeout.short });
    return await this.output.textContent() ?? '';
  }

  /**
   * Gets the current command line text (without the prompt)
   * @returns The current command line text
   */
  public async getCurrentCommand(): Promise<string> {
    await this.waitForPrompt(); // Ensure prompt is ready

    // Get the text from the terminal's active buffer
    const terminalText = await this.page.evaluate((promptString) => {
      const terminal = (window as any).terminalInstance; // Use type assertion if needed
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
   * Waits for specific text to appear in the output container.
   * It's generally recommended to call waitForPrompt *before* this
   * if the output is expected after a command completes.
   * @param text The text to wait for
   */
  public async waitForOutput(text: string): Promise<void> {
    await this.output.getByText(text, { exact: false }).waitFor({ timeout: TEST_CONFIG.timeout.long });
  }

  /**
   * Waits for specific text to appear in the next chars display
   * @param text The text to wait for
   */
  public async waitForNextChars(text: string, options?: { timeout?: number }): Promise<void> {
    await this.waitForPrompt(); // Ensure terminal is generally ready
    // First wait for the element to exist
    await this.nextChars.waitFor({ state: 'attached', timeout: options?.timeout ?? TEST_CONFIG.timeout.short });

    // Then wait for the specific text
    await this.nextChars.waitFor({ state: 'visible', timeout: options?.timeout ?? TEST_CONFIG.timeout.short });
    await expect(this.nextChars).toHaveText(text, { timeout: options?.timeout ?? TEST_CONFIG.timeout.long });
  }


  /**
   * Waits for the prompt ('> ') to appear on the last line AND for the terminal
   * output on that line to stabilize, indicating readiness for input.
   */
  public async waitForPrompt(stabilityTimeout: number = 300, overallTimeout: number = TEST_CONFIG.timeout.long): Promise<void> {
    // First ensure the main container is loaded
    await this.waitForTerminalContainer();
    // Wait for the prompt text itself to appear
    await this.terminal.getByText(this.prompt).last().waitFor({ timeout: overallTimeout });

    const startTime = Date.now();
    let stable = false;
    let lastLineContent = '';

    while (Date.now() - startTime < overallTimeout && !stable) {
      const currentLineContent = await this.page.evaluate(() => {
        const term = (window as any).terminalInstance;
        if (!term) return null;
        const buffer = term.buffer.active;
        // Get the line where the cursor currently is
        const line = buffer.getLine(buffer.cursorY);
        return line ? line.translateToString(true) : null; // Get trimmed line content
      });

      if (currentLineContent === null) {
        // Add a small delay and retry if terminal instance wasn't ready
        await this.page.waitForTimeout(100);
        continue;
        // throw new Error('waitForPrompt: Could not get terminal line content.');
      }

      // Check if content contains the prompt and hasn't changed since last check
      if (currentLineContent.includes(this.prompt) && currentLineContent === lastLineContent) {
        stable = true;
      } else {
        lastLineContent = currentLineContent;
        // Wait for the stability period before checking again
        await this.page.waitForTimeout(stabilityTimeout);
      }
    }

    if (!stable) {
      const finalLineContent = await this.page.evaluate(() => {
         const term = (window as any).terminalInstance;
         if (!term) return null;
         const buffer = term.buffer.active;
         const line = buffer.getLine(buffer.cursorY);
         return line ? line.translateToString(true) : null;
      });
      throw new Error(`waitForPrompt timed out after ${overallTimeout}ms waiting for stability. Last line content: "${finalLineContent}"`);
    }
     // Optional: Add a very small final delay just in case, though stability check should cover it.
     // await this.page.waitForTimeout(50);
  }


  /**
   * Clears the current command line using Ctrl+C
   */
  public async clearLine(): Promise<void> {
    await this.waitForPrompt(); // Ensure prompt is ready
    await this.terminal.click();
    await this.page.keyboard.press('Control+C');
    await this.waitForPrompt(); // Wait for the new prompt after Ctrl+C
  }

  async completeTutorials(): Promise<void> {

    // Set completed tutorials in localStorage
    await this.page.evaluate((tutorials) => {
      localStorage.setItem('completed-tutorials', JSON.stringify(tutorials));
    }, allTutorialKeys);

    // Execute command - test must wait for result
    await this.executeCommand('complete');

    // Wait for the tutorial prompt to disappear and terminal to be ready
    // INCREASED TIMEOUT for transition robustness
    await this.waitForActivityTransition(TEST_CONFIG.timeout.long);
    // waitForActivityTransition now waits for prompt at the end
  }

  /**
 * Gets the actual terminal line content, including the prompt
 * @returns The full terminal line content
 */
  public async getActualTerminalLine(): Promise<string> {
    await this.waitForPrompt(); // Ensure prompt is ready
    return await this.page.evaluate(() => {
      const terminal = (window as any).terminalInstance; // Use type assertion if needed
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
    await this.waitForPrompt(); // Ensure prompt is ready
    return await this.terminal.innerText();
  }
}
