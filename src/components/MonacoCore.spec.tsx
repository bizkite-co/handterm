import { render, screen, waitFor } from '@testing-library/react';
import MonacoCore from './MonacoCore';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { initVimMode } from 'monaco-vim';
import * as navigationUtils from '../utils/navigationUtils';
import * as vimTutorialSignals from '../signals/vimTutorialSignals';
import * as appSignals from '../signals/appSignals';

// Mock the entire monaco-editor module *once* before all tests.
vi.mock('monaco-editor/esm/vs/editor/editor.api', () => ({
  editor: {
    create: vi.fn(),
    defineTheme: vi.fn(),
    setTheme: vi.fn(),
    setModelLanguage: vi.fn(),
    updateOptions: vi.fn(),
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
    (monaco.editor.create as any).mockReturnValue({
      dispose: vi.fn(),
      focus: vi.fn(),
      getModel: vi.fn(() => ({
        getValue: vi.fn(() => ''),
        getLanguageId: vi.fn(() => 'plaintext'),
      })),
      updateOptions: vi.fn(),
      onDidBlurEditorText: vi.fn(),
      onDidFocusEditorText: vi.fn(),
      onKeyDown: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    });
    (initVimMode as any).mockReturnValue({ dispose: vi.fn(), on: vi.fn() });
    render(<MonacoCore mode="editor" value="" {...{containerRef: mockContainerRef, statusBarRef: mockStatusBarRef}} /> as any);
    expect(screen.getByTestId('monaco-editor-container')).toBeInTheDocument();
  });

  it('initializes the Monaco editor', async () => {
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
    render(<MonacoCore mode="editor" value="" {...{containerRef: mockContainerRef, statusBarRef: mockStatusBarRef}} /> as any);
    await waitFor(() => {
      expect(monaco.editor.create).toHaveBeenCalledTimes(1);
    });
  });

  it('initializes Vim mode', async () => {
    const mockEditor = {
      dispose: vi.fn(),
      getModel: vi.fn(() => ({
        getValue: vi.fn(() => ''),
        getLanguageId: vi.fn(() => 'plaintext'),
      })),
      updateOptions: vi.fn(),
      focus: vi.fn(),
      onDidBlurEditorText: vi.fn(),
      onDidFocusEditorText: vi.fn(),
    };
    (monaco.editor.create as any).mockReturnValue(mockEditor);
    (initVimMode as any).mockReturnValue({ dispose: vi.fn() });

    await render(<MonacoCore mode="editor" value="" {...{containerRef: mockContainerRef, statusBarRef: mockStatusBarRef}} /> as any);

    await waitFor(() => {
      expect(initVimMode).toHaveBeenCalledWith(mockEditor, expect.anything());
    }, { timeout: 2000 });
  });

  it('restores the terminal theme when an editor-mode editor unmounts', async () => {
    const mockEditor = {
      dispose: vi.fn(),
      getModel: vi.fn(() => ({
        getValue: vi.fn(() => ''),
        getLanguageId: vi.fn(() => 'plaintext'),
      })),
      updateOptions: vi.fn(),
      focus: vi.fn(),
      onDidBlurEditorText: vi.fn(),
      onDidFocusEditorText: vi.fn(),
      onKeyDown: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    };
    (monaco.editor.create as any).mockReturnValue(mockEditor);
    (initVimMode as any).mockReturnValue({ dispose: vi.fn(), on: vi.fn() });

    const { unmount } = render(<MonacoCore mode="editor" value="" {...{containerRef: mockContainerRef, statusBarRef: mockStatusBarRef}} /> as any);

    await waitFor(() => {
      expect(monaco.editor.setTheme).toHaveBeenCalledWith('vs-dark');
    });

    unmount();

    expect(monaco.editor.setTheme).toHaveBeenCalledWith('handterm-transparent');
  });

  it('focuses the editor on mount in editor mode', async () => {
    const focus = vi.fn();
    const mockEditor = {
      dispose: vi.fn(),
      focus,
      getModel: vi.fn(() => ({
        getValue: vi.fn(() => ''),
        getLanguageId: vi.fn(() => 'plaintext'),
      })),
      updateOptions: vi.fn(),
      onDidBlurEditorText: vi.fn(),
      onDidFocusEditorText: vi.fn(),
      onKeyDown: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    };
    (monaco.editor.create as any).mockReturnValue(mockEditor);
    (initVimMode as any).mockReturnValue({ dispose: vi.fn(), on: vi.fn() });

    render(<MonacoCore mode="editor" value="" {...{containerRef: mockContainerRef, statusBarRef: mockStatusBarRef}} /> as any);

    await waitFor(() => {
      expect(focus).toHaveBeenCalled();
    });
  });

  it('advances tutorial step when Enter is pressed and step is completed in vimtut mode', async () => {
    vi.spyOn(navigationUtils, 'parseLocation').mockReturnValue({
      activityKey: 'edit',
      contentKey: 'vimtut',
      groupKey: null,
    });

    const mockEditor = {
      dispose: vi.fn(),
      focus: vi.fn(),
      getValue: vi.fn(() => ''),
      getModel: vi.fn(() => ({
        getValue: vi.fn(() => ''),
        getLanguageId: vi.fn(() => 'plaintext'),
      })),
      setValue: vi.fn(),
      setPosition: vi.fn(),
      revealPosition: vi.fn(),
      getPosition: vi.fn(() => ({ lineNumber: 1, column: 1 })),
      onDidChangeCursorPosition: vi.fn(() => ({ dispose: vi.fn() })),
      onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
      updateOptions: vi.fn(),
      onDidBlurEditorText: vi.fn(),
      onDidFocusEditorText: vi.fn(),
      onKeyDown: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    };
    (monaco.editor.create as any).mockReturnValue(mockEditor);
    (initVimMode as any).mockReturnValue({ dispose: vi.fn(), on: vi.fn() });

    vimTutorialSignals.resetVimTutorial();
    vimTutorialSignals.vimStepCompletedSignal.value = true;
    expect(vimTutorialSignals.vimTutorialStepIndexSignal.value).toBe(0);

    const { unmount } = render(<MonacoCore mode="editor" value="" {...{containerRef: mockContainerRef, statusBarRef: mockStatusBarRef}} /> as any);

    // Dispatch Enter key event on window
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    window.dispatchEvent(enterEvent);

    expect(vimTutorialSignals.vimTutorialStepIndexSignal.value).toBe(1);
    expect(vimTutorialSignals.vimStepCompletedSignal.value).toBe(false);

    unmount();
  });

  it('auto-advances tutorial step and records accomplishment when step condition is met', async () => {
    vi.useFakeTimers();
    vi.spyOn(navigationUtils, 'parseLocation').mockReturnValue({
      activityKey: 'edit',
      contentKey: 'vimtut',
      groupKey: null,
    });

    const mockEditor = {
      dispose: vi.fn(),
      focus: vi.fn(),
      getValue: vi.fn(() => ''),
      getModel: vi.fn(() => ({
        getValue: vi.fn(() => ''),
        getLanguageId: vi.fn(() => 'plaintext'),
      })),
      setValue: vi.fn(),
      setPosition: vi.fn(),
      revealPosition: vi.fn(),
      // Position that satisfies Lesson 1.1 targetCursor (line 3, col 36)
      getPosition: vi.fn(() => ({ lineNumber: 3, column: 36 })),
      onDidChangeCursorPosition: vi.fn(() => ({ dispose: vi.fn() })),
      onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
      updateOptions: vi.fn(),
      onDidBlurEditorText: vi.fn(),
      onDidFocusEditorText: vi.fn(),
      onKeyDown: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    };
    (monaco.editor.create as any).mockReturnValue(mockEditor);
    (initVimMode as any).mockReturnValue({ dispose: vi.fn(), on: vi.fn() });

    vimTutorialSignals.resetVimTutorial();
    expect(vimTutorialSignals.vimTutorialStepIndexSignal.value).toBe(0);

    const { unmount } = render(<MonacoCore mode="editor" value="" {...{containerRef: mockContainerRef, statusBarRef: mockStatusBarRef}} /> as any);

    // Initial check conditions ran; it passed because cursor is on target
    expect(vimTutorialSignals.vimStepCompletedSignal.value).toBe(true);
    expect(vimTutorialSignals.lastVimAccomplishmentSignal.value?.stepId).toBe('vim-01-hjkl');

    // Accomplishment should be recorded into terminal Output elements
    const outputs = appSignals.outputElementsSignal.value;
    expect(outputs.some(o => typeof o.response === 'string' && o.response.includes('Accomplished:'))).toBe(true);

    // Fast-forward past the 300ms auto-advance timer
    vi.advanceTimersByTime(500);

    // Step index should now be advanced to 1
    expect(vimTutorialSignals.vimTutorialStepIndexSignal.value).toBe(1);

    unmount();
    vi.useRealTimers();
  });
});