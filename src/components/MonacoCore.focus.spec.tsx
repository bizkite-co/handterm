import { render, waitFor } from '@testing-library/react';
import MonacoCore from './MonacoCore';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

vi.mock('monaco-editor/esm/vs/editor/editor.api', () => ({
  editor: {
    create: vi.fn(),
    defineTheme: vi.fn(),
    setTheme: vi.fn(),
    setModelLanguage: vi.fn(),
    updateOptions: vi.fn(),
  },
}));

vi.mock('monaco-vim', () => ({
  initVimMode: vi.fn(),
}));

describe('MonacoCore', () => {
  const mockContainerRef = { current: document.createElement('div') };
  const mockStatusBarRef = { current: document.createElement('div') };

  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
      vi.restoreAllMocks();
      localStorage.clear();
  })

  it('renders and creates editor with terminal options', async () => {
    (monaco.editor.create as any).mockReturnValue({
      dispose: vi.fn(),
      getModel: vi.fn(() => ({
        getValue: vi.fn(() => ''),
        getLanguageId: vi.fn(() => 'plaintext'),
      })),
      updateOptions: vi.fn(),
      focus: vi.fn(),
      onDidBlurEditorText: vi.fn(),
      onDidFocusEditorText: vi.fn(),
    });
    render(<MonacoCore value="" mode="terminal" {...{containerRef: mockContainerRef, statusBarRef: mockStatusBarRef}}/> as any);
    await waitFor(() => {
      expect(monaco.editor.create).toHaveBeenCalled();
    });
  });
});
