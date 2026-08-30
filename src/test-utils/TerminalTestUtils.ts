import { screen } from '@testing-library/react';

export class TerminalTestUtils {
  static async waitForTerminal(): Promise<HTMLElement> {
    return screen.findByTestId('monaco-editor-container');
  }

  static async getTerminalContent(): Promise<string> {
    const terminal = await this.waitForTerminal();
    return terminal.textContent || '';
  }

  static async getPromptCount(): Promise<number> {
      const terminal = await screen.findByTestId('monaco-editor-container');
      return (terminal.textContent?.match(/> /g) || []).length;
  }

  static async waitForPrompt(): Promise<void> {
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
