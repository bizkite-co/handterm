import { type Page, type Locator, expect } from '@playwright/test';
import { allTutorialKeys } from '@handterm/types';

import { TERMINAL_CONSTANTS } from 'src/constants/terminal';
import { TEST_CONFIG } from '../config';
import { setupBrowserWindow } from '../browser-setup/setupWindow';


// REMOVED declare global block - types are now in packages/types/src/window.ts

export class TerminalPage {
  readonly page: Page;
  readonly terminal: Locator;
  readonly terminalElementId = 'monaco-editor-container';
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
    // Wait for the app to mount and signal readiness first
    await this.waitForAppReady();

    // Then verify window functions are exposed (waits for useEffect to run)
    await setupBrowserWindow(this.page);

    // Now proceed with waiting for terminal elements
    await this.waitForTerminalContainer();
    await this.waitForPrompt();
  }

  public async getOutput(): Promise<string[]> {
    return this.output.allInnerTexts();
  }

  /**
   * Navigate to the app base URL and wait for DOM content to load.
   */
  public async goto(): Promise<void> {
    await this.page.goto(TEST_CONFIG.baseUrl);
    await this.page.waitForLoadState('domcontentloaded');
  }

  // UPDATED METHOD: Wait for app readiness signal with duration logging
  async waitForAppReady(timeout: number = TEST_CONFIG.timeout.medium): Promise<void> {
    const startTime = Date.now();
    try {
      // Wait for the flag set in App.tsx's useEffect
      await this.page.waitForFunction(() => window.appReady === true, null, { timeout });
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
      const terminal = document.querySelector('.monaco-editor-container');
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
      const terminalEl = await this.page.$('.monaco-editor-container');
      if (!terminalEl) {
        throw new Error('Terminal element (.monaco-editor-container) not found');
      }
      console.log(`[waitForTerminalContainer] .monaco-editor-container found in ${Date.now() - startTime}ms`);

      // Check if terminal has children.
      if (!await this.terminalHasChildren()) {
        // Add a small delay and retry once, sometimes children take a moment
        await this.page.waitForTimeout(200);
        if (!await this.terminalHasChildren()) {
          throw new Error('Terminal element (.monaco-editor-container) has no children after retry');
        }
      }
      console.log(`[waitForTerminalContainer] .monaco-editor-container has children in ${Date.now() - startTime}ms`);

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
            const activity = ActivityType[normalizedActivity as keyof typeof ActivityType];
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
   * Waits for the terminal to be visible and ready.
   * Alias for waitForTerminalContainer + waitForPrompt.
   */
  public async waitForTerminal(): Promise<void> {
    await this.waitForTerminalContainer();
    await this.waitForPrompt();
  }

  /**
   * Waits for the prompt ('> ') to appear on the last line AND for the terminal
   * output on that line to stabilize, indicating readiness for input.
   * Uses Monaco editor model API (replaced XTerm buffer API).
   */
  public async waitForPrompt(stabilityTimeout: number = 300, overallTimeout: number = TEST_CONFIG.timeout.long): Promise<void> {
    const startTime = Date.now();
    try {
      // Wait for Monaco editor instance to be available
      await this.page.waitForFunction(
        () => window.monacoEditor != null,
        null,
        { timeout: overallTimeout }
      );
      console.log(`[waitForPrompt] Monaco editor ready in ${Date.now() - startTime}ms`);

      // Wait for the prompt string to appear in the editor model
      await this.page.waitForFunction((prompt: string) => {
        const editor = window.monacoEditor;
        if (!editor) return false;
        const model = editor.getModel();
        if (!model) return false;
        const lineCount = model.getLineCount();
        const lastLine = model.getLineContent(lineCount);
        return lastLine.includes(prompt);
      }, this.prompt, { timeout: overallTimeout });
      console.log(`[waitForPrompt] Prompt string found in model in ${Date.now() - startTime}ms`);

      // Stability check: ensure last line content hasn't changed
      let stable = false;
      let lastLineContent = '';
      const stabilityStartTime = Date.now();

      while (Date.now() - stabilityStartTime < overallTimeout && !stable) {
        const currentLineContent = await this.page.evaluate(() => {
          const editor = window.monacoEditor;
          if (!editor) return null;
          const model = editor.getModel();
          if (!model) return null;
          const lineCount = model.getLineCount();
          return model.getLineContent(lineCount);
        });

        if (currentLineContent === null) {
          await this.page.waitForTimeout(100);
          continue;
        }

        if (currentLineContent.includes(this.prompt) && currentLineContent === lastLineContent) {
          stable = true;
        } else {
          lastLineContent = currentLineContent;
          await this.page.waitForTimeout(stabilityTimeout);
        }
      }

      if (!stable) {
        const duration = Date.now() - startTime;
        throw new Error(`waitForPrompt timed out after ${duration}ms waiting for stability. Last line: "${lastLineContent}"`);
      }
      const duration = Date.now() - startTime;
      console.log(`[waitForPrompt] Stability achieved in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[waitForPrompt] Timed out after ${duration}ms`);
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
 * @returns The full terminal line content (last line of Monaco model)
 */
  public async getActualTerminalLine(): Promise<string> {
    await this.waitForPrompt(); // Ensure prompt is ready
    return await this.page.evaluate(() => {
      const editor = window.monacoEditor;
      if (!editor) return '';
      const model = editor.getModel();
      if (!model) return '';
      const lineCount = model.getLineCount();
      return model.getLineContent(lineCount);
    });
  }

  /**
    * Gets the full terminal content
    * @returns The entire text content of the Monaco editor model
    */
  public async getFullTerminalContent(): Promise<string> {
    await this.waitForPrompt(); // Ensure prompt is ready
    return await this.page.evaluate(() => {
      const editor = window.monacoEditor;
      if (!editor) return '';
      return editor.getValue() ?? '';
    });
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
