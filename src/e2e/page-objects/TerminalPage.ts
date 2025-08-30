import { type Page, type Locator, expect } from '@playwright/test';
import { allTutorialKeys } from '@handterm/types';

import { TERMINAL_CONSTANTS } from 'src/constants/terminal';
import { TEST_CONFIG } from '../config';
import { setupBrowserWindow } from '../browser-setup/setupWindow';
import { getDefaultAutoSelectFamilyAttemptTimeout } from 'net';


// REMOVED declare global block - types are now in packages/types/src/window.ts

export class TerminalPage {
  readonly page: Page;
  readonly terminal: Locator;
  readonly terminalElementId = 'xtermRef';
  readonly output: Locator;
  readonly tutorialMode: Locator;
  readonly gameMode: Locator;
  readonly nextChars: Locator;
  private readonly prompt = TERMINAL_CONSTANTS.PROMPT;

  constructor(page: Page) {
    this.page = page;
    this.terminal = page.locator('#' + this.terminalElementId);
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

  public async getOutput() {
    return this.output.allInnerTexts();
  }

  // UPDATED METHOD: Wait for app readiness signal with duration logging
  async waitForAppReady(timeout: number = TEST_CONFIG.timeout.medium): Promise<void> {
    const startTime = Date.now();
    try {
      // Wait for the flag set in App.tsx's useEffect
      await this.page.waitForFunction(() => (window as any).appReady === true, null, { timeout });
      const duration = Date.now() - startTime;
      console.log(`[waitForAppReady] Completed in ${duration}ms (timeout: ${timeout}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[waitForAppReady] Timed out after ${duration}ms (timeout: ${timeout}ms)`);
      throw new Error(`Timeout waiting for app readiness signal after ${timeout}ms`);
    }
  }
  // END UPDATED METHOD

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
    const startTime = Date.now();
    try {
      // Wait for application wrapper to load
      // Increased timeout slightly for initial load robustness
      await this.page.waitForSelector('#handterm-wrapper', { state: 'attached', timeout: TEST_CONFIG.timeout.medium });
      console.log(`[waitForTerminalContainer] #handterm-wrapper attached in ${Date.now() - startTime}ms (timeout: ${TEST_CONFIG.timeout.medium}ms)`);

      // Wait for terminal element container
      const xtermRef = await this.page.$('#xtermRef');
      if (!xtermRef) {
        throw new Error('Terminal element (#xtermRef) not found');
      }
      console.log(`[waitForTerminalContainer] #xtermRef found in ${Date.now() - startTime}ms`);

      // Check if #xtermRef has children.
      if (!await this.terminalHasChildren()) {
        // Add a small delay and retry once, sometimes children take a moment
        await this.page.waitForTimeout(200);
        if (!await this.terminalHasChildren()) {
          throw new Error('Terminal element (#xtermRef) has no children after retry');
        }
      }
      console.log(`[waitForTerminalContainer] #xtermRef has children in ${Date.now() - startTime}ms`);

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[waitForTerminalContainer] Timed out after ${duration}ms`);
      throw error;
    }
  }

  /**
   * Focuses the terminal
   */
  public async focus(): Promise<void> {
    await this.waitForPrompt(); // Ensure prompt is ready before focus
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
          // NEW: Wait for the terminal container to be visible
          await this.page.waitForSelector('#prompt-and-terminal', { state: 'visible', timeout: timeout });
          console.log(`[waitForActivityTransition] #prompt-and-terminal visible in ${Date.now() - startTime}ms`);
          // END NEW

          // NEW: Wait for the URL to change back to the base URL
          const baseUrl = this.page.url().split('?')[0];
          await this.page.waitForURL(baseUrl ?? '', { timeout: timeout });
          console.log(`[waitForActivityTransition] URL changed back to base URL in ${Date.now() - startTime}ms`);
          // END NEW

          // Add a small delay to allow rendering to catch up
          await this.page.waitForTimeout(500); // Add a small delay after URL change
          console.log(`[waitForActivityTransition] Added 500ms delay after URL change`);

          // Also ensure the terminal prompt is back after transition
          await this.waitForPrompt();
          console.log(`[waitForActivityTransition] Completed in ${Date.now() - startTime}ms (timeout: ${timeout}ms)`);
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

    const duration = Date.now() - startTime;
    throw new Error(`Activity transition timed out after ${duration}ms (timeout: ${timeout}ms)`);
  }

  /**
   * Waits for specific text to appear in the output container.
   * It's generally recommended to call waitForPrompt *before* this
   * if the output is expected after a command completes.
   * @param text The text to wait for
   */
  public async waitForOutput(text: string): Promise<void> {
    const startTime = Date.now();
    try {
      // Wait for the container itself to be present
      await this.output.waitFor({ state: 'attached', timeout: TEST_CONFIG.timeout.short });
      // Then wait for the specific text
      await this.output.getByText(text, { exact: false }).waitFor({ timeout: TEST_CONFIG.timeout.long });
      const duration = Date.now() - startTime;
      console.log(`[waitForOutput] Text "${text}" appeared in ${duration}ms (timeout: ${TEST_CONFIG.timeout.long}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[waitForOutput] Timed out waiting for text "${text}" after ${duration}ms (timeout: ${TEST_CONFIG.timeout.long}ms)`);
      throw error;
    }
  }

  /**
   * Waits for specific text to appear in the next chars display
   * @param text The text to wait for
   */
  public async waitForNextChars(text: string, options?: { timeout?: number }): Promise<void> {
    const timeout = options?.timeout ?? TEST_CONFIG.timeout.short;
    const longTimeout = options?.timeout ?? TEST_CONFIG.timeout.long;
    const startTime = Date.now();
    try {
      await this.waitForPrompt(); // Ensure terminal is generally ready
      // First wait for the element to exist
      await this.nextChars.waitFor({ state: 'attached', timeout });
      console.log(`[waitForNextChars] Element attached in ${Date.now() - startTime}ms (timeout: ${timeout}ms)`);

      // Then wait for the specific text
      await this.nextChars.waitFor({ state: 'visible', timeout });
      console.log(`[waitForNextChars] Element visible in ${Date.now() - startTime}ms (timeout: ${timeout}ms)`);

      await expect(this.nextChars).toHaveText(text, { timeout: longTimeout });
      const duration = Date.now() - startTime;
      console.log(`[waitForNextChars] Text "${text}" appeared in ${duration}ms (timeout: ${longTimeout}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[waitForNextChars] Timed out waiting for text "${text}" after ${duration}ms (timeout: ${longTimeout}ms)`);
      throw error;
    }
  }


  /**
   * Waits for the prompt ('> ') to appear on the last line AND for the terminal
   * output on that line to stabilize, indicating readiness for input.
   */
  public async waitForPrompt(stabilityTimeout: number = 300, overallTimeout: number = TEST_CONFIG.timeout.long): Promise<void> {
    const startTime = Date.now();
    try {
      // Ensure the main terminal container is visible and ready
      // This is now handled in waitForActivityTransition before this is called.
      // We can add a check here for the terminal instance itself being ready.
      await this.page.waitForFunction(
        () => (window as any).terminalInstance
          ?.buffer?.active,
        null,
        { timeout: overallTimeout }
      );
      console.log(`[waitForPrompt] Terminal instance buffer ready in ${Date.now() - startTime}ms`);

      // Wait for the prompt string to appear in the terminal's innerText
      await this.page.waitForFunction((args: (string | undefined)[]) => {
        const prompt = args[0];
        const terminalElementId = args[1];
        const terminalElement = document.getElementById(terminalElementId);
        if (!terminalElement) return false;
        return terminalElement.innerText.includes(prompt);
      }, [this.prompt, this.terminalElementId], { timeout: overallTimeout });
      console.log(`[waitForPrompt] Prompt string found in innerText in ${Date.now() - startTime}ms`);


      let stable = false;
      let lastLineContent = '';
      const stabilityStartTime = Date.now();

      while (Date.now() - stabilityStartTime < overallTimeout && !stable) {
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
        const duration = Date.now() - startTime;
        throw new Error(`waitForPrompt timed out after ${duration}ms (overallTimeout: ${overallTimeout}ms) waiting for stability. Last line content: "${finalLineContent}"`);
      }
      const duration = Date.now() - startTime;
      console.log(`[waitForPrompt] Stability achieved in ${duration}ms (overallTimeout: ${overallTimeout}ms)`);

      // Optional: Add a very small final delay just in case, though stability check should cover it.
      // await this.page.waitForTimeout(50);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[waitForPrompt] Timed out after ${duration}ms (overallTimeout: ${overallTimeout}ms)`);
      throw error;
    }
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

  // Restored executeCommand method
  public async executeCommand(command: string): Promise<void> {
    await this.typeCommand(command);
    await this.pressEnter();
  }

  // Restored typeCommand method
  public async typeCommand(command: string): Promise<void> {
    await this.waitForPrompt(); // Ensure prompt is ready before typing
    await this.terminal.click(); // Click to ensure focus
    await this.page.keyboard.type(command);
  }

  // Restored pressEnter method
  public async pressEnter(): Promise<void> {
    await this.waitForPrompt(); // Ensure prompt is ready before pressing Enter
    await this.page.keyboard.press('Enter');
  }
}
