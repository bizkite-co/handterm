import { test, expect } from '@playwright/test';
import { allTutorialKeys } from '@handterm/types';
import { TEST_CONFIG } from './config';
import { TerminalPage } from './page-objects/TerminalPage';

// Regression: typing on a game level must remove characters from the
// nextChars display as the command line grows (real keystrokes, real Monaco).
test.describe('game nextChars shrink while typing', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((keys) => {
      localStorage.setItem('completed-tutorials', JSON.stringify(keys));
    }, allTutorialKeys);
  });

  test('a game phrase shrinks with each real keystroke', async ({ page }) => {
    await page.goto(TEST_CONFIG.baseUrl);
    const term = new TerminalPage(page);
    await term.initialize();

    await page.waitForFunction(() => (window as any).monacoEditor != null);
    await page.evaluate(() => (window as any).monacoEditor.focus());

    await page.keyboard.type('play');
    await page.keyboard.press('Enter');

    const phrase = 'all sad lads ask dad; alas fads fall';
    await term.waitForNextChars(phrase);

    await page.keyboard.type('a');
    await expect(term.nextChars).toHaveText('ll sad lads ask dad; alas fads fall');

    await page.keyboard.type('l');
    await expect(term.nextChars).toHaveText('l sad lads ask dad; alas fads fall');

    await page.keyboard.type('l');
    await expect(term.nextChars).toHaveText(' sad lads ask dad; alas fads fall');
  });
});