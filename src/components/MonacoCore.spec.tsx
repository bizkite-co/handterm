import { render, screen, waitFor } from '@testing-library/react';
import MonacoCore from './MonacoCore';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { initVimMode } from 'monaco-vim';

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

  it('renders without crashing', () => {
    render(<MonacoCore value="" {...{containerRef: mockContainerRef, statusBarRef: mockStatusBarRef}} /> as any);
    expect(screen.getByTestId('monaco-editor-container')).toBeInTheDocument();
  });

  it('initializes the Monaco editor', async () => {
    (monaco.editor.create as any).mockReturnValue({
      dispose: vi.fn(),
      getModel: vi.fn(() => ({
        getValue: vi.fn(() => ''),
      })),
    });
    render(<MonacoCore value="" {...{containerRef: mockContainerRef, statusBarRef: mockStatusBarRef}} /> as any);
    await waitFor(() => {
      expect(monaco.editor.create).toHaveBeenCalledTimes(1);
    });
  });

  it('initializes Vim mode', async () => {
    const mockEditor = {
      dispose: vi.fn(),
      getModel: vi.fn(() => ({
        getValue: vi.fn(() => ''),
      })),
    };
    (monaco.editor.create as any).mockReturnValue(mockEditor);
    (initVimMode as any).mockReturnValue({ dispose: vi.fn() });

    await render(<MonacoCore value="" {...{containerRef: mockContainerRef, statusBarRef: mockStatusBarRef}} /> as any);

    await waitFor(() => {
      expect(initVimMode).toHaveBeenCalledWith(mockEditor, expect.anything());
    }, { timeout: 2000 });
  });
});