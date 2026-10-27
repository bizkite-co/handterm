import type { VimModeInstance } from 'monaco-vim';
import * as monacoVim from 'monaco-vim';
import { createLogger, LogLevel } from './Logger';

const logger = createLogger({ prefix: 'vimUtils', level: LogLevel.WARN });

// ── Configurable vim keybinding ──────────────────────────────────────────────
// Canonical key combination to exit vim insert mode across Handterm (like NVim's :imap).
// Set to 'Escape' for traditional vim, or 'Alt+s' to avoid Monaco stealing focus.
export const VIM_ESCAPE_KEY_COMBO = 'Alt+s';
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Checks whether a keyboard event matches Handterm's insert-mode exit key combination
 * or the standard Escape key.
 */
export function isVimEscapeKey(e: {
  browserEvent?: KeyboardEvent;
  key?: string;
  altKey?: boolean;
}): boolean {
  const browserKey = e.browserEvent?.key ?? e.key;
  const isAlt = e.browserEvent?.altKey ?? e.altKey ?? false;

  if (VIM_ESCAPE_KEY_COMBO === 'Alt+s' && browserKey?.toLowerCase() === 's' && isAlt) {
    return true;
  }
  if (browserKey === 'Escape') {
    return true;
  }
  return false;
}

/**
 * Exits Vim insert mode cleanly and transitions the Vim state to normal mode.
 */
export function exitVimInsertMode(vimInstance: VimModeInstance | null): void {
  if (!vimInstance) return;
  try {
    monacoVim.VimMode.Vim.handleKey(vimInstance, '<Esc>');
  } catch (err) {
    logger.warn('exitVimInsertMode: could not trigger vim exit-insert', err);
  }
}
