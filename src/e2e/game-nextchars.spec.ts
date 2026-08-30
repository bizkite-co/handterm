import { test, expect, type Page } from '@playwright/test';
import { TEST_CONFIG } from './config';
import { TerminalPage } from './page-objects/TerminalPage';

const TUTORIAL_TEXTS: Record<string, string> = {
  '\r': 'most important key',
  fdsa: 'Type `fdsa`',
  'jkl;': 'Type `jkl;`',
  '01234': 'type numbers 0-4',
  '56789': 'type numbers 5-9',
};

// Real progression: \r -> fdsa -> jkl; -> GAME first-eight -> 01234 ->
// 56789 -> GAME numbers. Asserts nextChars shrinks on BOTH game levels
// reached through real tutorial progression.
test.describe('game nextChars shrink through real progression', () => {
  async function waitForTutorialPrompt(page: Page, fragment: string) {
    await page.waitForFunction(
      ({ fragment }) => (document.querySelector('.tutorial-prompt')?.textContent ?? '').includes(fragment),
      { fragment },
      { timeout: TEST_CONFIG.timeout.extraLong }
    );
  }

  async function waitForNextCharsText(page: Page, text: string) {
    await page.waitForFunction(
      ({ text }) => (document.querySelector('pre#next-chars')?.textContent ?? '').includes(text),
      { text },
      { timeout: TEST_CONFIG.timeout.extraLong }
    );
  }

  test('typing shrinks nextChars on game levels after tutorial progression', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto(TEST_CONFIG.baseUrl);
    const term = new TerminalPage(page);
    await term.initialize();

    // \r tutorial: ENTER completes it.
    await waitForTutorialPrompt(page, TUTORIAL_TEXTS['\r']);
    await page.evaluate(() => (window as any).monacoEditor.focus());
    await page.keyboard.press('Enter');

    // fdsa tutorial: chord row shrinks per correctly typed character, then
    // auto-advances on the final character (no ENTER needed).
    await waitForTutorialPrompt(page, TUTORIAL_TEXTS.fdsa);
    await page.evaluate(() => (window as any).monacoEditor.focus());
    await page.keyboard.type('fd');
    await expect(page.locator('[data-testid="tutorial-chords"]')).toHaveText('sa');
    await page.keyboard.type('sa');

    // jkl; tutorial: shrinks per correctly typed character, auto-advances on ';'.
    await waitForTutorialPrompt(page, TUTORIAL_TEXTS['jkl;']);
    await page.evaluate(() => (window as any).monacoEditor.focus());
    await page.keyboard.type('jk');
    await expect(page.locator('[data-testid="tutorial-chords"]')).toHaveText('l;');
    await page.keyboard.type('l');
    await expect(page.locator('[data-testid="tutorial-chords"]')).toHaveText(';');
    await page.keyboard.type(';');

    // GAME 1: first-eight.
    await waitForNextCharsText(page, 'all sad lads ask dad; alas fads fall');
    await page.evaluate(() => (window as any).monacoEditor.focus());
    await page.keyboard.type('a');
    await expect(term.nextChars).toHaveText('ll sad lads ask dad; alas fads fall');
    await page.keyboard.type('l');
    await expect(term.nextChars).toHaveText('l sad lads ask dad; alas fads fall');

    // Complete game 1 -> routes to the 01234 tutorial; both tutorials here
    // auto-advance on their final character (no ENTER).
    await page.keyboard.type('l sad lads ask dad; alas fads fall');
    await waitForTutorialPrompt(page, TUTORIAL_TEXTS['01234']);
    await page.evaluate(() => (window as any).monacoEditor.focus());
    await page.keyboard.type('01234');

    await waitForTutorialPrompt(page, TUTORIAL_TEXTS['56789']);
    await page.evaluate(() => (window as any).monacoEditor.focus());
    await page.keyboard.type('56789');

    // GAME 2: numbers, reached via real progression.
    await waitForNextCharsText(page, '0123 4567 8901 2345 6789 0987');
    await page.evaluate(() => (window as any).monacoEditor.focus());
    await page.keyboard.type('0');
    await expect(term.nextChars).toHaveText('123 4567 8901 2345 6789 0987');

    await page.keyboard.type('1');
    await expect(term.nextChars).toHaveText('23 4567 8901 2345 6789 0987');
  });
});