import { test, expect } from '@playwright/test';
import { ActivityType, type WindowExtensions } from '@handterm/types';
import { signal } from '@preact/signals-core';

// Extend Window interface with our extensions
declare global {
  interface Window extends WindowExtensions {}
}

test.describe('Editor Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForSelector('.monaco-editor');

    // Initialize signals before each test
    await page.evaluate(() => {
      // Initialize required window properties
      window.ActivityType = ActivityType;

      // Create signals
      window.activityStateSignal = signal({
        current: ActivityType.NORMAL,
        previous: null,
        transitionInProgress: false,
        tutorialCompleted: false
      });

      window.tutorialSignals = {
        currentStep: signal(0),
        totalSteps: signal(0),
        isComplete: signal(false)
      };

      window.commandLineSignal = signal('');

      // Set up activity function
      window.setActivity = (activity) => {
        const currentState = window.activityStateSignal.value;
        window.activityStateSignal.value = {
          current: activity,
          previous: currentState.current,
          transitionInProgress: false,
          tutorialCompleted: currentState.tutorialCompleted
        };
      };

      // Set up execute command function
      window.executeCommand = async (command: string) => {
        window.commandLineSignal.value = command;
        await new Promise((resolve) => setTimeout(resolve, 500));
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
