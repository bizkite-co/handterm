// Mock monaco-vim *once* before all tests. We don't actually need the real one.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defineVimCommands } from './MonacoCore'; // Import the named export
import { ActivityType } from '@handterm/types';
import { navigate, parseLocation } from '../utils/navigationUtils';

// Mock the entire monaco-editor module *once* before all tests.
vi.mock('monaco-editor/esm/vs/editor/editor.api', () => ({
  editor: {
    create: vi.fn(),
    defineTheme: vi.fn(),
    setTheme: vi.fn(),
    setModelLanguage: vi.fn(),
    updateOptions: vi.fn(),
  },
}), { virtual: true });

import * as monacoVim from 'monaco-vim';

vi.mock('monaco-vim', () => ({
  initVimMode: vi.fn(),
  VimMode: { Vim: {} },
}), { virtual: true });
vi.mock('../utils/navigationUtils');

describe('MonacoCore - defineVimCommands', () => {
  let mockEditorRef: any;

  beforeEach(() => {
    mockEditorRef = { current: { getValue: vi.fn() } };
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('defines the :q! command', () => {
    const defineExSpy = vi.fn();
    (monacoVim as any).VimMode = {
      Vim: {
        defineEx: defineExSpy,
      },
    };

    defineVimCommands(mockEditorRef);

    expect(defineExSpy).toBeDefined();
    expect(defineExSpy).toHaveBeenCalledWith('q', '', expect.any(Function));
    expect(defineExSpy).toHaveBeenCalledWith('quit', 'q', expect.any(Function));
    expect(defineExSpy).toHaveBeenCalledWith('q!', '', expect.any(Function));

    const qCommandCallback = defineExSpy.mock.calls.find(call => call[0] === 'q!')[2];
    qCommandCallback();

    expect(navigate).toHaveBeenCalledWith({ activityKey: ActivityType.NORMAL });
    expect(localStorage.getItem('editContent')).toBeNull();
  });

  it('returns to browse view on :q when opened from browse mode', () => {
    vi.mocked(parseLocation).mockReturnValue({
      activityKey: ActivityType.EDIT,
      contentKey: 'owner/repo/main.py',
      groupKey: 'github/owner/repo',
      clearParams: false,
    });

    const defineExSpy = vi.fn();
    (monacoVim as any).VimMode = {
      Vim: {
        defineEx: defineExSpy,
      },
    };

    defineVimCommands(mockEditorRef);
    const qCommandCallback = defineExSpy.mock.calls.find(call => call[0] === 'q')[2];
    qCommandCallback();

    expect(navigate).toHaveBeenCalledWith({
      activityKey: ActivityType.BROWSE,
      contentKey: 'github/owner/repo',
      groupKey: null,
    });
  });

  it('defines the :next / :n command for vimtut step advancement', () => {
    const defineExSpy = vi.fn();
    (monacoVim as any).VimMode = {
      Vim: {
        defineEx: defineExSpy,
      },
    };

    const onAdvanceSpy = vi.fn();
    defineVimCommands(mockEditorRef, undefined, undefined, undefined, onAdvanceSpy);

    expect(defineExSpy).toHaveBeenCalledWith('next', 'n', expect.any(Function));

    const nextCommandCallback = defineExSpy.mock.calls.find(call => call[0] === 'next')[2];
    nextCommandCallback();

    expect(onAdvanceSpy).toHaveBeenCalledTimes(1);
  });

  it('defines the :h / :hint and :r / :restart commands', () => {
    const defineExSpy = vi.fn();
    (monacoVim as any).VimMode = {
      Vim: {
        defineEx: defineExSpy,
      },
    };

    const onRestartSpy = vi.fn();
    defineVimCommands(mockEditorRef, undefined, undefined, undefined, undefined, onRestartSpy);

    expect(defineExSpy).toHaveBeenCalledWith('h', '', expect.any(Function));
    expect(defineExSpy).toHaveBeenCalledWith('hint', '', expect.any(Function));
    expect(defineExSpy).toHaveBeenCalledWith('r', '', expect.any(Function));
    expect(defineExSpy).toHaveBeenCalledWith('restart', '', expect.any(Function));

    const restartCallback = defineExSpy.mock.calls.find(call => call[0] === 'r')[2];
    restartCallback();
    expect(onRestartSpy).toHaveBeenCalledTimes(1);
  });
});