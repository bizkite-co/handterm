import { type Page, type Locator } from '@playwright/test';
import { TEST_CONFIG } from '../config';
import { setupBrowserWindow } from '../browser-setup/setupWindow';
/**
 * Page object for interacting with the Monaco editor in Vim mode.
 * This represents a TUI (Text User Interface) element that only accepts keyboard input.
 * No mouse interactions or button clicks should be used except for initial focus.
 */
export class EditorPage {
  readonly page: Page;
  readonly editor: Locator;
  readonly statusBar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.editor = page.locator('.monaco-editor');
    this.statusBar = page.locator('.vim-status-bar');
  }

  async initialize(): Promise<void> {
    await setupBrowserWindow(this.page);
  }

  /**
   * Waits for the editor to be ready and visible
   */
  public async waitForEditor(): Promise<void> {
    await this.editor.waitFor({ state: 'visible', timeout: TEST_CONFIG.timeout.short });
    await this.statusBar.waitFor({ state: 'visible', timeout: TEST_CONFIG.timeout.short });
  }

  /**
   * Focuses the editor and ensures it's in Vim normal mode.
   * Also moves cursor to end of line ($ command in Vim).
   * This is the only method that should use mouse interaction (for initial focus).
   */
  public async focus(): Promise<void> {
    await this.editor.click();
    await this.page.keyboard.press('Escape');
    await this.page.waitForFunction(() => {
      const statusBar = document.querySelector('.vim-status-bar');
      return statusBar?.textContent?.includes('NORMAL');
    }, { timeout: TEST_CONFIG.timeout.short });

    // Move to end of line
    await this.sendKeys('$');
  }

  /**
   * Gets the current cursor position
   */
  public async getCursorPosition(): Promise<{ lineNumber: number; column: number }> {
    return await this.page.evaluate(() => {
      const editor = window.monacoEditor;
      if (!editor) throw new Error('Monaco editor not found');
      return editor.getPosition();
    });
  }

  /**
   * Gets the current editor content
   */
  public async getContent(): Promise<string> {
    return await this.page.evaluate(() => {
      const editor = window.monacoEditor;
      if (!editor) throw new Error('Monaco editor not found');
      return editor.getValue();
    });
  }

  /**
   * Sends keyboard input to the editor.
   * All editor interaction should go through this method to maintain TUI principles.
   * @param keys The keys to send, one at a time
   */
  public async sendKeys(keys: string): Promise<void> {
    for (const key of keys) {
      await this.page.keyboard.press(key);
      // Small delay to ensure key is processed
      await this.page.waitForTimeout(50);
    }
  }

  /**
   * Gets the current Vim mode from the status bar
   */
  public async getVimMode(): Promise<string> {
    const statusText = await this.statusBar.textContent();
    return statusText ?? '';
  }
}