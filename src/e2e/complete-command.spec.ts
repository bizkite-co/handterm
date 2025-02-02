import { test, expect } from '@playwright/test';
import { ActivityType } from '@handterm/types';

test.describe('Editor Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForSelector('.monaco-editor');

    // Initialize signals before each test
    await page.evaluate(() => {
      window.activitySignal = {
        value: ActivityType.NORMAL,
        set: () => {},
        subscribe: () => {}
      };

      window.tutorialSignals = {
        currentStep: {
          value: 0,
          set: () => {}
        },
        totalSteps: {
          value: 0,
          set: () => {}
        },
        isComplete: {
          value: false,
          set: () => {},
          subscribe: () => {}
        }
      } as any;

      window.commandLineSignal = {
        value: '',
        set: () => {},
        subscribe: () => {}
      };
    });
  });

  test('should load text and allow basic VIM editing', async ({ page }) => {
    // Load initial content
    await page.evaluate(async () => {
      if (window.executeCommand) {
        await window.executeCommand('edit --text "test"');
      }
    });

    // Verify editor content
    const editorContent = await page.$eval(
      '.monaco-editor textarea',
      (el: HTMLTextAreaElement) => el.value
    );
    expect(editorContent).toContain('test');

    // Enter VIM normal mode and delete last character
    await page.keyboard.press('Escape'); // Enter normal mode
    await page.keyboard.press('x'); // Delete last character

    // Verify updated content
    const updatedContent = await page.$eval(
      '.monaco-editor textarea',
      (el: HTMLTextAreaElement) => el.value
    );
    expect(updatedContent).toBe('tes');
  });
});
