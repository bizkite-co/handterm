import { render, waitFor } from '@testing-library/react';
import MonacoCore from './MonacoCore';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ActivityType } from '@handterm/types';

// Mock the entire monaco-editor module *once* before all tests.
vi.mock('monaco-editor/esm/vs/editor/editor.api', () => ({
  editor: {
    create: vi.fn(),
  },
}));

// Mock monaco-vim *once* before all tests. We don't actually need the real one.
vi.mock('monaco-vim', () => ({
  initVimMode: vi.fn((_editor: any, _statusBar: any) => {
    // Mock implementation of initVimMode that sets up the window.MonacoVim object.
    (window as any).MonacoVim = {
      VimMode: {
        Vim: {
          defineEx: (command: string, _alias: string, func: () => void) => {
            if (command === 'q!') {
              if (typeof func === 'function') {
                func();
              }
            }
          },
        },
      },
    };
    return { dispose: () => {} };
  }),
}));

describe('MonacoCore', () => {
  const mockContainerRef = { current: document.createElement('div') };
  const mockStatusBarRef = { current: document.createElement('div') };

  beforeEach(() => {
    // Reset mock state before each test
    vi.resetAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
      // Restore mocks after each test
      vi.restoreAllMocks();
      localStorage.clear();
  })

    it('defines the :q! command', async () => {
        // Local, comprehensive mock for window
        const originalWindow = global.window;
        const mockDefineEx = vi.fn().mockImplementation((command, alias, func) => {
            if (typeof func === 'function') {
                func(); // Actually call the function!
            }
        });
        const mockVimMode = {
            VimMode: {
                Vim: {
                    defineEx: mockDefineEx,
                },
            },
        };
        const setActivityMock = vi.fn();

        (global as any).window = {
            MonacoVim: mockVimMode,
            setActivity: setActivityMock,
        }

        vi.useFakeTimers();
        await render(<MonacoCore value="" {...{containerRef: mockContainerRef, statusBarRef: mockStatusBarRef}} /> as any);
        vi.advanceTimersByTime(1000);
        vi.runAllTimers();


        await waitFor(() => {
            expect(mockDefineEx).toHaveBeenCalledWith('q!', '', expect.any(Function));
        }, { timeout: 2000 });

        expect(setActivityMock).toHaveBeenCalledWith(ActivityType.NORMAL);
        global.window = originalWindow; // Restore original window
    });
});