import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineVimCommands } from './MonacoCore'; // Import the named export
import { ActivityType } from '@handterm/types';

// Mock the entire monaco-editor module *once* before all tests.
vi.mock('monaco-editor/esm/vs/editor/editor.api', () => ({
  editor: {
    create: vi.fn(),
  },
}));

// Mock monaco-vim *once* before all tests. We don't actually need the real one.
vi.mock('monaco-vim', () => ({
  initVimMode: vi.fn().mockImplementation(() => {
        (window as any).MonacoVim = {
            VimMode: {
                Vim: {
                    defineEx: vi.fn(), // Mock defineEx here
                }
            }
        }
        return {dispose: () => {}};
    }),
}));


describe('MonacoCore - defineVimCommands', () => { // Changed describe block

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

    it('defines the :q! command', () => {
    const mockEditorRef = { current: { getValue: vi.fn() } } as any; // Cast to any
    const mockSetActivity = vi.fn();

    // Local, comprehensive mock for window
    const originalWindow = global.window;

    // We do *not* mock defineEx here.  We mock it *inside* the initVimMode mock.
    const mockVimMode = {
      VimMode: {
        Vim: {
          defineEx: vi.fn(), // This will be called by the component
        },
      },
    };

    (global as any).window = {
        MonacoVim: mockVimMode, // Use the mockVimMode
        setActivity: mockSetActivity,
    }


    // Call the function directly
    defineVimCommands(mockEditorRef, window, () => { return false; });

    // Assert that defineEx was called with the correct arguments
    expect(window.MonacoVim.VimMode.Vim.defineEx).toHaveBeenCalledWith('q!', '', expect.any(Function));

    // Simulate calling the q! command (get it from the mock calls)
    const qCommand = (window.MonacoVim.VimMode.Vim.defineEx as any).mock.calls.find((call: any) => call[0] === 'q!')[2];
    qCommand();

    // Assert that setActivity was called correctly
    expect(mockSetActivity).toHaveBeenCalledWith(ActivityType.NORMAL);
    global.window = originalWindow; // Restore original window.
  });
});