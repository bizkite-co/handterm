import { test, expect, type Page } from '@playwright/test';
import { TerminalPage } from 'src/e2e/page-objects/TerminalPage';
import { allTutorialPhraseNames } from 'src/types/Types';

test.describe('Complete Command', () => {
  let terminal: TerminalPage;
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    terminal = new TerminalPage(page);
    await terminal.goto();
  });

  test('should mark tutorial as completed and navigate home', async () => {
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('NAVIGATING to:')) {
        logs.push(msg.text());
      }
    });

    // Execute complete command
    await terminal.executeCommand('complete');

    // Verify navigation logs
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatch(/NAVIGATING to:.*activity=normal/);

    // Verify localStorage update
    const completed: string[] = await page.evaluate((): string[] => {
      const stored = localStorage.getItem('completed-tutorials');
      return stored ? JSON.parse(stored) as string[] : [];
    });
    expect(completed).toEqual(allTutorialPhraseNames);

    // Verify navigation to home page
    await expect(page).toHaveURL(/activity=normal/);

    // Verify success message
    const success = page.locator('.success-message');
    await expect(success).toContainText('Tutorial completed successfully');
  });
});
