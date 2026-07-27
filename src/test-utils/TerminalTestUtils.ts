import { screen } from '@testing-library/react';
import { TERMINAL_CONSTANTS } from '../constants/terminal';

export class TerminalTestUtils {
  static async waitForTerminal() {
    return screen.findByTestId('monaco-editor-container');
  }

  static async getTerminalContent() {
    const terminal = await this.waitForTerminal();
    return terminal.textContent || '';
  }

  static async getPromptCount() {
      const terminal = await screen.findByTestId('monaco-editor-container');
      return (terminal.textContent?.match(/> /g) || []).length;
  }

  static async waitForPrompt() {
    // Wait for the prompt to appear
    return new Promise<void>((resolve) => {
      const observer = new MutationObserver(async () => {
        const terminal = screen.queryByTestId('monaco-editor-container'); // Use queryByTestId here
        if (terminal && terminal.textContent?.includes('> ')) {
          observer.disconnect();
          resolve();
        }
      });

      observer.observe(document.body, { // Observe the entire body
        childList: true,
        subtree: true,
        characterData: true
      });
    });
  }
}
