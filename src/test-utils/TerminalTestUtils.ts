import { screen } from '@testing-library/react';
import { TERMINAL_CONSTANTS } from '../constants/terminal';

export class TerminalTestUtils {
  static async waitForTerminal() {
    return screen.findByTestId('xtermRef');
  }

  static async getTerminalContent() {
    const terminal = await this.waitForTerminal();
    return terminal.textContent || '';
  }

  static async getPromptCount() {
    const content = await this.getTerminalContent();
    return (content.match(new RegExp(TERMINAL_CONSTANTS.PROMPT, 'g')) || []).length;
  }

  static async waitForPrompt() {
    const terminal = await this.waitForTerminal();
    // Wait for the prompt to appear
    return new Promise<void>((resolve) => {
      const observer = new MutationObserver(async () => {
        if (await this.getPromptCount() > 0) {
          observer.disconnect();
          resolve();
        }
      });
      
      observer.observe(terminal, {
        childList: true,
        subtree: true,
        characterData: true
      });
    });
  }
}