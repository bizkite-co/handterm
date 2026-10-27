import { describe, it, expect, vi } from 'vitest';

vi.mock('monaco-vim', () => {
  const handleKey = vi.fn();
  return {
    default: {
      initVimMode: vi.fn(),
    },
    initVimMode: vi.fn(),
    VimMode: {
      Vim: {
        handleKey,
        exitInsertMode: vi.fn(),
      },
    },
  };
});

import { isVimEscapeKey, exitVimInsertMode, VIM_ESCAPE_KEY_COMBO } from '../vimUtils';
import * as monacoVim from 'monaco-vim';
import type { VimModeInstance } from 'monaco-vim';

describe('vimUtils', () => {
  it('defines Alt+s as the default exit insert mode combo', () => {
    expect(VIM_ESCAPE_KEY_COMBO).toBe('Alt+s');
  });

  describe('isVimEscapeKey', () => {
    it('detects Alt+s key event', () => {
      expect(isVimEscapeKey({ key: 's', altKey: true })).toBe(true);
      expect(isVimEscapeKey({ browserEvent: { key: 's', altKey: true } as KeyboardEvent })).toBe(true);
    });

    it('detects Escape key event', () => {
      expect(isVimEscapeKey({ key: 'Escape', altKey: false })).toBe(true);
      expect(isVimEscapeKey({ browserEvent: { key: 'Escape', altKey: false } as KeyboardEvent })).toBe(true);
    });

    it('returns false for unrelated keys', () => {
      expect(isVimEscapeKey({ key: 's', altKey: false })).toBe(false);
      expect(isVimEscapeKey({ key: 'a', altKey: true })).toBe(false);
      expect(isVimEscapeKey({ key: 'Enter', altKey: false })).toBe(false);
    });
  });

  describe('exitVimInsertMode', () => {
    it('calls Vim.handleKey with <Esc>', () => {
      const mockVimInstance = {} as VimModeInstance;
      exitVimInsertMode(mockVimInstance);

      expect(monacoVim.VimMode.Vim.handleKey).toHaveBeenCalledWith(mockVimInstance, '<Esc>');
    });

    it('handles null vimInstance safely without error', () => {
      expect(() => exitVimInsertMode(null)).not.toThrow();
    });
  });
});
