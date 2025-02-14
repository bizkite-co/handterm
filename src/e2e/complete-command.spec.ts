import { test, expect, type Page } from '@playwright/test';
import { TerminalPage } from './page-objects/TerminalPage';
import { allTutorialPhraseNames } from 'src/types/Types';

interface TutorialSignals {
  value: {
    isCompleted: boolean;
    currentTutorial: string | null;
  };
}

// Declare global types for the custom event
declare global {
  interface Window {
    onLocationChange?: (detail: {
      activity: string;
      key: string | null;
      group: string | null;
    }) => void;
  }

  interface LocationChangeEvent extends CustomEvent<{
    activity: string;
    key: string | null;
    group: string | null;
  }> {}
}

test.describe('Complete Command', () => {
  let terminal: TerminalPage;
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    terminal = new TerminalPage(page);
    await terminal.goto();

    // Initialize tutorial signals
    await page.evaluate(() => {
      (window as any).tutorialSignals = {
        currentStep: { value: '0' },
        totalSteps: { value: 5 },
        isCompleted: { value: false }
      };
    });
  });

  test('should mark tutorial as completed and navigate home', async () => {
    const logs: string[] = [];

    // Clear existing logs
    await page.evaluate(() => console.clear());

    // Start logging just before command execution
    const logHandler = (msg: { text: () => string }) => {
      const message = msg.text();
      if (message && message.includes('NAVIGATING to:')) {
        logs.push(message);
      }
    };
    page.on('console', logHandler);

    // Log current activity state before command
    const preCommandState = await page.evaluate(() => {
      return {
        activity: window.location.search,
        localStorage: localStorage.getItem('completed-tutorials')
      };
    });
    console.log('Pre-command state:', preCommandState);

    // Execute complete command with debug logging
    console.log('Executing complete command...');
    await terminal.executeCommand('complete');
    console.log('Complete command executed');

    // Log immediate post-command state
    const postCommandState = await page.evaluate(() => {
      const signals = (window as typeof window & { tutorialSignals?: TutorialSignals }).tutorialSignals;
      return {
        activity: window.location.search,
        localStorage: localStorage.getItem('completed-tutorials'),
        tutorialSignals: signals ? {
          isCompleted: signals.value.isCompleted,
          currentTutorial: signals.value.currentTutorial
        } : null
      };
    });
    console.log('Post-command state:', postCommandState);

    // Debug tutorial signals initialization
    const signalsCheck = await page.evaluate(() => {
      const signals = (window as typeof window & { tutorialSignals?: TutorialSignals }).tutorialSignals;
      return {
        exists: !!signals,
        isCompleted: signals?.value.isCompleted,
        currentTutorial: signals?.value.currentTutorial
      };
    });
    console.log('Tutorial signals check:', signalsCheck);

    // Wait for tutorial signals to update with increased timeout
    await page.waitForFunction(() => {
      const signals = (window as typeof window & { tutorialSignals?: TutorialSignals }).tutorialSignals;
      if (!signals) {
        console.error('Tutorial signals not found');
        return false;
      }
      console.log('Current signals state:', {
        isCompleted: signals.value.isCompleted,
        currentTutorial: signals.value.currentTutorial
      });
      return signals.value.isCompleted === true;
    }, { timeout: 30000 });

    // Track all navigation events
    const navigationEvents: string[] = [];
    await page.exposeFunction('onLocationChange', (detail: {
      activity: string;
      key: string | null;
      group: string | null
    }) => {
      const event = `NAVIGATION: activity=${detail.activity} key=${detail.key} group=${detail.group}`;
      navigationEvents.push(event);
      console.log(event);
    });

    await page.addInitScript(() => {
      // Add event listener with proper typing
      const originalPushState = history.pushState.bind(history);
      const originalReplaceState = history.replaceState.bind(history);

      // Override history methods to trigger custom event
      // Define type for history methods
      type HistoryMethod = (
        data: any,
        unused: string,
        url?: string | URL | null
      ) => void;

      // Override methods directly with arrow functions
      history.pushState = (...args: Parameters<HistoryMethod>) => {
        const result = originalPushState.call(history, ...args);
        window.dispatchEvent(new CustomEvent('locationchange', {
          detail: {
            activity: new URL(window.location.href).searchParams.get('activity'),
            key: new URL(window.location.href).searchParams.get('key'),
            group: new URL(window.location.href).searchParams.get('group')
          }
        }));
        return result;
      };

      history.replaceState = (...args: Parameters<HistoryMethod>) => {
        const result = originalReplaceState.call(history, ...args);
        window.dispatchEvent(new CustomEvent('locationchange', {
          detail: {
            activity: new URL(window.location.href).searchParams.get('activity'),
            key: new URL(window.location.href).searchParams.get('key'),
            group: new URL(window.location.href).searchParams.get('group')
          }
        }));
        return result;
      };

      // Listen for popstate events
      window.addEventListener('popstate', () => {
        window.dispatchEvent(new CustomEvent('locationchange', {
          detail: {
            activity: new URL(window.location.href).searchParams.get('activity'),
            key: new URL(window.location.href).searchParams.get('key'),
            group: new URL(window.location.href).searchParams.get('group')
          }
        }));
      });

      // Initial event
      window.dispatchEvent(new CustomEvent('locationchange', {
        detail: {
          activity: new URL(window.location.href).searchParams.get('activity'),
          key: new URL(window.location.href).searchParams.get('key'),
          group: new URL(window.location.href).searchParams.get('group')
        }
      }));
    });

    // Add network logging
    page.on('request', request => {
      console.log('REQUEST:', request.method(), request.url());
    });

    // Check current URL before waiting
    console.log('Current URL before wait:', page.url());

    // Add navigation state debugging
    // Add type declaration for tutorial signals
    interface TutorialSignals {
      value: {
        isCompleted: boolean;
        currentTutorial: string | null;
      };
    }

    const navigationState = await page.evaluate(() => {
      const signals = (window as typeof window & { tutorialSignals?: TutorialSignals }).tutorialSignals;
      return {
        activity: window.location.search,
        localStorage: localStorage.getItem('completed-tutorials'),
        tutorialSignals: signals ? {
          isCompleted: signals.value.isCompleted,
          currentTutorial: signals.value.currentTutorial
        } : null
      };
    });
    console.log('Navigation state:', navigationState);

    try {
      await page.waitForURL(/activity=normal/, { timeout: 10000 });
    } catch (err) {
      console.error('Navigation timeout error:', err);
      console.log('Current URL after timeout:', page.url());

      // If navigation didn't complete, try manual reload
      await page.reload();
      console.log('URL after reload:', page.url());

      // Verify we're on the correct activity
      await expect(page).toHaveURL(/activity=normal/, { timeout: 5000 });
    }
    console.log('Navigation completed to:', page.url());

    // Clean up listener
    page.off('console', logHandler);

    // Verify complete navigation sequence
    expect(navigationEvents).toEqual([
      expect.stringContaining('activity=tutorial'),
      expect.stringContaining('activity=normal')
    ]);

    // Verify localStorage update
    const completed: string[] = await page.evaluate((): string[] => {
      const stored = localStorage.getItem('completed-tutorials');
      return stored ? JSON.parse(stored) as string[] : [];
    });
    expect(completed).toEqual(allTutorialPhraseNames);

    // Wait for navigation and verify URL
    await page.waitForURL(/activity=normal/);
    await expect(page).toHaveURL(/activity=normal/);

    // Verify success message
    const success = page.locator('.success-message');
    await expect(success).toContainText('Tutorial completed successfully');
  });
});
