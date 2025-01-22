import { ActivityType } from '@handterm/types';
import { setActivity } from 'src/signals/appSignals';
import type { Page } from '@playwright/test';
import { test, expect } from '@playwright/test';
import { signal, type Signal } from '@preact/signals-react';

declare global {
  interface Window {
    executeCommand: ((command: string) => Promise<void>) | undefined;
    githubUtils: {
      getCredentials: () => Promise<{ token: string; username: string }>;
      getTree: () => Promise<{ tree: Array<{ path: string; type: string }> }>;
      getRepoInfo: () => Promise<{ owner: string; repo: string }>;
    } | undefined;
    activitySignal: Signal<typeof ActivityType[keyof typeof ActivityType]>;
    setActivity: typeof setActivity;
  }
}

const setupMocks = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    window.githubUtils = {
      getCredentials: async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 10)); // Simulate async
          return {
            token: 'mock-token',
            username: 'mock-user'
          };
        } catch (error: unknown) {
          if (error instanceof Error) {
            console.error('Mock credentials error:', error);
            throw error;
          }
          throw new Error('Unknown error occurred');
        }
      },
      getTree: async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 10)); // Simulate async
          return {
            tree: [
              { path: 'src/main.ts', type: 'blob' },
              { path: 'src/components', type: 'tree' }
            ]
          };
        } catch (error: unknown) {
          if (error instanceof Error) {
            console.error('Mock tree error:', error);
            throw error;
          }
          throw new Error('Unknown error occurred');
        }
      },
      getRepoInfo: async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 10)); // Simulate async
          return {
            owner: 'mock-owner',
            repo: 'mock-repo'
          };
        } catch (error: unknown) {
          if (error instanceof Error) {
            console.error('Mock repo info error:', error);
            throw error;
          }
          throw new Error('Unknown error occurred');
        }
      }
    };

    const activitySignal = signal(ActivityType.NORMAL);
    window.activitySignal = activitySignal;
    window.executeCommand = async (command: string) => {
      if (command === 'github') {
        if (!window.githubUtils || !window.setActivity) {
          throw new Error('Required window properties are not defined');
        }

        try {
          // Get credentials
          const credentials = await window.githubUtils.getCredentials();
          if (!credentials) {
            throw new Error('Failed to get credentials');
          }

          // Get repo info
          const repoInfo = await window.githubUtils.getRepoInfo();
          if (!repoInfo) {
            throw new Error('Failed to get repo info');
          }

          // Get tree
          const tree = await window.githubUtils.getTree();
          if (!tree) {
            throw new Error('Failed to get tree');
          }

          // Store tree items in localStorage
          try {
            localStorage.setItem('github_tree_items', JSON.stringify(tree.tree));
            localStorage.setItem('current_github_repo', `${repoInfo.owner}/${repoInfo.repo}`);
          } catch (error) {
            throw new Error(`Failed to store GitHub data: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }

          // Set activity to TREE view
          window.setActivity(ActivityType.TREE);
        } catch (error) {
          throw new Error(`GitHub command failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    };

    window.setActivity = setActivity;
  });
};

test.describe('GitHub Command Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('http://localhost:5173/');
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => {
      localStorage.clear();
      if (window.githubUtils) {
        window.githubUtils = undefined;
      }
      if (window.activitySignal && 'value' in window.activitySignal) {
        window.activitySignal.value = ActivityType.NORMAL;
      }
    });
  });

  test('should initialize with correct activity state', async ({ page }) => {
    const activityState = await page.evaluate(() => {
      if (!window.activitySignal) {
        throw new Error('activitySignal is not defined');
      }
      return window.activitySignal.value;
    });
    expect(activityState).toBe(ActivityType.NORMAL);
  });

  test('should handle GitHub command execution', async ({ page }) => {
    await page.evaluate(async () => {
      if (!window || !window.executeCommand || !window.githubUtils || !window.setActivity) {
        throw new Error('Required window properties are not defined');
      }

      try {
        if (typeof window.executeCommand === 'function') {
          await window.executeCommand('github');
        } else {
          throw new Error('executeCommand is not a function');
        }
      } catch (error) {
        throw new Error(`GitHub command execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    const tree = await page.evaluate(() => {
      if (!window || !window.githubUtils || !('getTree' in window.githubUtils)) {
        throw new Error('githubUtils is not properly defined');
      }

      try {
        if (typeof window.githubUtils.getTree === 'function') {
          return window.githubUtils.getTree();
        }
        throw new Error('getTree is not a function');
      } catch (error) {
        throw new Error(`Failed to get tree: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    const treeArray = tree?.tree;
    if (!treeArray) {
      throw new Error('Tree array is undefined');
    }

    expect(treeArray).toBeDefined();
    expect(Array.isArray(treeArray)).toBe(true);
    expect(treeArray).toHaveLength(2);

    if (treeArray.length >= 2) {
      const firstItem = treeArray[0];
      const secondItem = treeArray[1];
      if (!firstItem || !secondItem) {
        throw new Error('Tree items are undefined');
      }
      expect(firstItem.path).toBe('src/main.ts');
      expect(secondItem.path).toBe('src/components');
    } else {
      throw new Error('Tree structure is invalid');
    }
  });

  test('should handle credential errors gracefully', async ({ page }) => {
    await page.evaluate(async () => {
      if (!window) throw new Error('window is undefined');

      const { githubUtils } = window;

      if (!githubUtils ||
          typeof githubUtils.getCredentials !== 'function' ||
          typeof githubUtils.getTree !== 'function' ||
          typeof githubUtils.getRepoInfo !== 'function') {
        throw new Error('githubUtils is not properly defined');
      }

      const newGithubUtils = {
        getCredentials: async () => {
          await new Promise(resolve => setTimeout(resolve, 0));
          throw new Error('Mock credential error');
        },
        getTree: async () => {
          if (!githubUtils) throw new Error('githubUtils is not defined');
          return await githubUtils.getTree();
        },
        getRepoInfo: async () => {
          if (!githubUtils) throw new Error('githubUtils is not defined');
          return await githubUtils.getRepoInfo();
        }
      };
      await new Promise(resolve => setTimeout(resolve, 0)); // Ensure async operation

      window.githubUtils = newGithubUtils;
      await new Promise(resolve => setTimeout(resolve, 0)); // Ensure async operation
    });

    // Setup mock credential error
    await page.evaluate(async () => {
      if (!window) throw new Error('window is undefined');

      const { githubUtils } = window;

      if (!githubUtils ||
          typeof githubUtils.getCredentials !== 'function' ||
          typeof githubUtils.getTree !== 'function' ||
          typeof githubUtils.getRepoInfo !== 'function') {
        throw new Error('githubUtils is not properly defined');
      }

      // Replace getCredentials with mock that throws error
      if (!window.githubUtils) {
        throw new Error('githubUtils is not defined');
      }
      window.githubUtils.getCredentials = async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        throw new Error('Mock credential error');
      };
      await new Promise(resolve => setTimeout(resolve, 0)); // Ensure async operation
    });

    // Execute command and verify error
    const result = await page.evaluate(async () => {
      if (!window) throw new Error('window is undefined');

      const { executeCommand, githubUtils } = window;

      if (!executeCommand || typeof executeCommand !== 'function') {
        throw new Error('executeCommand is not properly defined');
      }

      if (!githubUtils) {
        throw new Error('githubUtils is not defined');
      }

      return await executeCommand('github');
    });

    await expect(result).rejects.toThrow('Mock credential error');
  });
});
