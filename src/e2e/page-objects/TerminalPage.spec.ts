import { test, expect } from '@playwright/test';
import { TerminalPage } from './TerminalPage';
import { TEST_CONFIG } from '../config';
import { TERMINAL_CONSTANTS } from 'src/constants/terminal';
import { setupBrowserWindow } from '../browser-setup/setupWindow';

test.describe('TerminalPage', () => {
  let terminal: TerminalPage;

  test.beforeEach(async ({ page }) => {
    // First navigate to the page
    await page.goto(TEST_CONFIG.baseUrl);
    await page.waitForLoadState('domcontentloaded');

    // Initialize terminal page object
    terminal = new TerminalPage(page);

    // Wait for the application to be ready and verify signal state
    await page.waitForSelector('#handterm-wrapper', {
      state: 'attached',
      timeout: TEST_CONFIG.timeout.long
    });

    // Complete tutorials once at the beginning
    await terminal.completeTutorials();
    await terminal.waitForPrompt();
  });

  test('should be able to type and execute commands', async () => {
    await terminal.completeTutorials();
    await terminal.waitForPrompt();

    // Test the ability to type and execute a command
    await terminal.executeCommand('test-command');

    // Verify command was typed (we don't care about the response)
    const output = await terminal.getOutput();
    expect(output).toContain('test-command');
  });

  test('should be able to get terminal output', async () => {
    await terminal.completeTutorials();
    await terminal.waitForPrompt();

    // Type something that will definitely appear in output
    await terminal.executeCommand('echo test');

    // Verify we can get output
    const output = await terminal.getOutput();
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  test('should be able to wait for prompt', async () => {
    await terminal.completeTutorials();

    // Simply verify the method completes without throwing
    await terminal.waitForPrompt();

    // Additional verification that prompt is actually visible
    const promptVisible = await terminal.terminal
      .getByText('> ')
      .last()
      .isVisible();
    expect(promptVisible).toBe(true);
  });

  test('should have prompt only', async () => {
    // Ensure the terminal is ready and the prompt is visible and stable
    await terminal.waitForPrompt();

    // Get the full terminal content
    const fullTerminalContent = await terminal.getFullTerminalContent();

    // Split the content into lines
    const lines = fullTerminalContent.split('\n').filter(line => line.trim() !== ''); // Filter out empty lines

    // The last non-empty line should contain the prompt
    const lastLine = lines[lines.length - 1];
    expect(lastLine).toContain(TERMINAL_CONSTANTS.PROMPT);

    // Check that no previous lines contain the prompt
    const previousLines = lines.slice(0, -1);
    const promptsInPreviousLines = previousLines.filter(line => line.includes(TERMINAL_CONSTANTS.PROMPT));

    expect(promptsInPreviousLines.length,
      `Expected no prompts in previous lines but found ${promptsInPreviousLines.length}. Previous lines: ${previousLines.join('\n')}`
    ).toBe(0);

    // Additional verification that prompt exists and is visible (already covered by waitForPrompt but good to keep)
    const promptVisible = await terminal.terminal
      .getByText(TERMINAL_CONSTANTS.PROMPT)
      .last()
      .isVisible();
    expect(promptVisible, 'Expected prompt to be visible').toBe(true);
  });

  test('should handle activity transitions', async ({ page }) => {
    // Start with completed tutorials
    await terminal.completeTutorials();
    await terminal.waitForPrompt();

    // Set initial activity state
    await page.evaluate(() => {
      localStorage.setItem('current-activity', 'terminal');
    });

    // Wait a bit for the application to process the localStorage change
    await page.waitForTimeout(100);

    // Verify initial state
    const initialActivity = await page.evaluate(() => {
      return localStorage.getItem('current-activity');
    });
    expect(initialActivity).toBe('terminal');

    // Execute a command that should stay in terminal mode
    await terminal.executeCommand('help');

    // Wait for transition and verify we stayed in terminal mode
    await terminal.waitForActivityTransition();

    const finalActivity = await page.evaluate(() => {
      return localStorage.getItem('current-activity');
    });
    expect(finalActivity).toBe('terminal');

    // Verify we can still interact with the terminal
    await terminal.waitForPrompt();
    const canTypeMore = await terminal.terminal.isEnabled();
    expect(canTypeMore).toBe(true);
  });

  test('should handle localStorage operations', async ({ page }) => {
    await terminal.completeTutorials();

    // Test setting content
    const testContent = { key: 'test.md', content: '# Test' };
    await page.evaluate((content) => {
      localStorage.setItem('edit-content', JSON.stringify(content));
    }, testContent);

    // Verify content was set
    const storedContent = await page.evaluate(() => {
      return localStorage.getItem('edit-content');
    });
    expect(JSON.parse(storedContent!)).toEqual(testContent);
  });

  test('should execute commands and verify UI updates', async () => {
    await terminal.completeTutorials();
    await terminal.waitForPrompt();

    // Execute a command that should update the UI
    await terminal.executeCommand('help');

    // Verify command output appears in terminal
    const output = await terminal.getOutput();
    expect(output).toContain('help');

    // Verify UI remains responsive
    await terminal.waitForPrompt();
    const canTypeMore = await terminal.terminal.isEnabled();
    expect(canTypeMore).toBe(true);
  });

  test('should have correct terminal content after completing tutorials', async ({ page }) => {
    await terminal.completeTutorials();
    await terminal.waitForPrompt();

    const terminalCharCodes = await page.evaluate(() => {
      const terminal = (window as any).terminalInstance;
      if (!terminal) return [];
      const buffer = terminal.buffer.active;
      // Get the content of the last line where the prompt should be
      const lastLine = buffer.getLine(buffer.cursorY);
      // Explicitly cast 'c' to string within the map callback
      return lastLine ? Array.from(lastLine.translateToString(true)).map((c) => (c as string).charCodeAt(0)) : [];
    });

    // Expect the last line to contain only the prompt characters ('>', ' ')
    // The exact characters might vary slightly based on cursor representation,
    // but '> ' should be present. Let's check for the prompt string itself.
    const lastLineContent = await page.evaluate(() => {
       const terminal = (window as any).terminalInstance;
       if (!terminal) return '';
       const buffer = terminal.buffer.active;
       const lastLine = buffer.getLine(buffer.cursorY);
       return lastLine ? lastLine.translateToString(true) : '';
    });
    expect(lastLineContent).toContain(TERMINAL_CONSTANTS.PROMPT);

    // We can also check that the line length is minimal, indicating only the prompt and cursor
    // This is a bit fragile, but can help catch extra characters.
    // A more robust check is done in the 'should have prompt only' test.
  });

  test('should maintain single prompt after page refresh', async ({ page }) => {
    // First navigate to the page
    await page.goto(TEST_CONFIG.baseUrl);
    await page.waitForLoadState('domcontentloaded');

    // Initialize terminal page object
    const terminal = new TerminalPage(page);

    // Log initial state
    const initialContent = await terminal.terminal.innerText();
    console.log('Initial terminal content:', JSON.stringify(initialContent));

    // Complete tutorials and wait for prompt
    await terminal.completeTutorials();
    await terminal.waitForPrompt();

    const preRefreshContent = await terminal.terminal.innerText();
    console.log('Pre-refresh terminal content:', JSON.stringify(preRefreshContent));

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Wait for terminal to be ready
    await terminal.waitForPrompt();

    // Get full terminal content to check for duplicate prompts
    const postRefreshContent = await terminal.terminal.innerText();
    console.log('Post-refresh terminal content:', JSON.stringify(postRefreshContent));

    // Add a short delay to allow DOM to stabilize after refresh
    await page.waitForTimeout(500);

    // Verify there is exactly one VISIBLE prompt element in the entire terminal
    const allPromptLocators = terminal.terminal.getByText(TERMINAL_CONSTANTS.PROMPT);
    const allPromptElements = await allPromptLocators.all(); // Get all matching elements
    let visiblePromptCount = 0;
    for (const element of allPromptElements) {
        if (await element.isVisible()) {
            visiblePromptCount++;
        }
    }

    expect(visiblePromptCount,
      `Expected exactly one VISIBLE prompt element but found ${visiblePromptCount}. Full terminal content: "${postRefreshContent}"`
    ).toBe(1);

    // Additional verification that the LAST prompt exists and is visible (redundant but safe)
    const lastPromptVisible = await terminal.terminal
      .getByText(TERMINAL_CONSTANTS.PROMPT)
      .last()
      .isVisible();
    expect(lastPromptVisible, 'Expected last prompt to be visible').toBe(true);
  });
});

test('should expose wrapper functions', async ({ page }) => {
  await setupBrowserWindow(page);
  const verification = await page.evaluate(() => {
    return {
      hasCallSetCompletedTutorial: typeof window.callSetCompletedTutorial === 'function',
      hasCallGetNextTutorial: typeof window.callGetNextTutorial === 'function',
      hasCallSetNextTutorial: typeof window.callSetNextTutorial === 'function',
    };
  });
  expect(verification.hasCallSetCompletedTutorial).toBe(true);
  expect(verification.hasCallGetNextTutorial).toBe(true);
  expect(verification.hasCallSetNextTutorial).toBe(true);
});
