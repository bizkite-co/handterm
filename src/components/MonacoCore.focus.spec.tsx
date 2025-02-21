import { render, waitFor } from '@testing-library/react';
import MonacoCore from './MonacoCore';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

// Mock the entire monaco-editor module *once* before all tests.
vi.mock('monaco-editor/esm/vs/editor/editor.api', () => ({
  editor: {
    create: vi.fn(),
  },
}));

// Mock monaco-vim *once* before all tests
vi.mock('monaco-vim', () => ({
  initVimMode: vi.fn(),
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

  it('focuses the editor after initialization', async () => {
      const mockFocus = vi.fn();
    (monaco.editor.create as any).mockReturnValue({
      dispose: vi.fn(),
      getModel: vi.fn(() => ({
        getValue: vi.fn(() => ''),
      })),
      focus: mockFocus,
    });
    await render(<MonacoCore value="" {...{containerRef: mockContainerRef, statusBarRef: mockStatusBarRef}}/> as any);
    await waitFor(() => {
      expect(mockFocus).toHaveBeenCalledTimes(1);
    }, { timeout: 8000 });
  });
});