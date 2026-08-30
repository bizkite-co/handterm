// Mock monaco-vim *once* before all tests. We don't actually need the real one.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defineVimCommands } from './MonacoCore'; // Import the named export
import { ActivityType } from '@handterm/types';
import { navigate } from '../utils/navigationUtils';

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
    expect(defineExSpy).toHaveBeenCalledWith('q!', '', expect.any(Function));

    const qCommandCallback = defineExSpy.mock.calls.find(call => call[0] === 'q!')[2];
    qCommandCallback();

    expect(navigate).toHaveBeenCalledWith({ activityKey: ActivityType.NORMAL });
    expect(localStorage.getItem('editContent')).toBeNull();
  });
});