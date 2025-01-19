import type { Page } from '@playwright/test';
import type * as monaco from 'monaco-editor';

declare global {
  interface Window {
    monacoEditor: monaco.editor.IStandaloneCodeEditor;
  }
}

export class HandTermPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto('http://localhost:5173');
  }

    async executeCommand(command: string): Promise<void> {
        const input = this.page.locator('#xtermRef');
        await input.fill(command);
        await input.press('Enter');
    }

  async getEditorContent(): Promise<string> {
    return await this.page.evaluate((): string => {
      const editor = window.monacoEditor;
      if (!editor) {
        throw new Error('Monaco editor not found');
      }
      const value = editor.getValue();
      if (typeof value !== 'string') {
        throw new Error('Expected string value from editor');
      }
      return value;
    });
  }
}
