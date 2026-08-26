import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defineVimCommands, SaveError } from './MonacoCore';
import * as monacoVim from 'monaco-vim';
import { putFile } from '../utils/awsApiClient';
import type { IAuthProps } from '../types/HandTerm';

vi.mock('monaco-editor/esm/vs/editor/editor.api', () => ({
  editor: {
    create: vi.fn(),
    defineTheme: vi.fn(),
    setTheme: vi.fn(),
    setModelLanguage: vi.fn(),
    updateOptions: vi.fn(),
  },
}), { virtual: true });

vi.mock('monaco-vim', () => ({
  initVimMode: vi.fn(),
  VimMode: { Vim: {} },
}), { virtual: true });

vi.mock('../utils/navigationUtils', () => ({
  parseLocation: vi.fn(() => ({ activityKey: 'edit', contentKey: '_index.md', groupKey: null })),
  navigate: vi.fn(),
}));
vi.mock('../utils/awsApiClient', () => ({ putFile: vi.fn() }));

const mockAuth = {} as IAuthProps;

describe('MonacoCore - :w save error propagation', () => {
  let mockEditorRef: { current: { getValue: () => string } };
  let defineExSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockEditorRef = { current: { getValue: vi.fn(() => 'file content') } };
    localStorage.clear();
    vi.clearAllMocks();
    defineExSpy = vi.fn();
    (monacoVim as unknown as { VimMode: { Vim: { defineEx: typeof defineExSpy } } }).VimMode = {
      Vim: { defineEx: defineExSpy },
    };
  });

  const getCallback = (name: string): (() => Promise<void> | void) => {
    const call = defineExSpy.mock.calls.find(c => c[0] === name);
    return call?.[2] as () => Promise<void> | void;
  };

  it('surfaces a typed SaveError on :w when putFile rejects (not swallowed)', async () => {
    (putFile as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network down'));
    const onSaveResult = vi.fn();

    defineVimCommands(mockEditorRef as any, mockAuth, undefined, onSaveResult);
    const wCallback = getCallback('w');
    await wCallback?.();
    await vi.waitFor(() => expect(onSaveResult).toHaveBeenCalledTimes(1));

    const result = onSaveResult.mock.calls[0][0];
    expect(result._tag).toBe('Left');
    expect(result.left).toBeInstanceOf(SaveError);
    expect(result.left.message).toMatch(/network down/);
  });

  it('surfaces Right on :w when putFile succeeds with 200', async () => {
    (putFile as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 200, data: { message: 'saved' } });
    const onSaveResult = vi.fn();

    defineVimCommands(mockEditorRef as any, mockAuth, undefined, onSaveResult);
    await getCallback('w')?.();
    await vi.waitFor(() => expect(onSaveResult).toHaveBeenCalledTimes(1));

    const result = onSaveResult.mock.calls[0][0];
    expect(result._tag).toBe('Right');
  });

  it('surfaces Left when putFile returns a non-200 status', async () => {
    (putFile as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 500, error: 'boom' });
    const onSaveResult = vi.fn();

    defineVimCommands(mockEditorRef as any, mockAuth, undefined, onSaveResult);
    await getCallback('w')?.();
    await vi.waitFor(() => expect(onSaveResult).toHaveBeenCalledTimes(1));

    const result = onSaveResult.mock.calls[0][0];
    expect(result._tag).toBe('Left');
    expect(result.left).toBeInstanceOf(SaveError);
    expect(result.left.message).toMatch(/500/);
  });

  it('surfaces Left and does not call putFile when auth is missing', async () => {
    const onSaveResult = vi.fn();

    defineVimCommands(mockEditorRef as any, undefined, undefined, onSaveResult);
    await getCallback('w')?.();
    await vi.waitFor(() => expect(onSaveResult).toHaveBeenCalledTimes(1));

    const result = onSaveResult.mock.calls[0][0];
    expect(result._tag).toBe('Left');
    expect(result.left.message).toMatch(/no auth context/);
    expect(putFile).not.toHaveBeenCalled();
  });

  it('falls back to logger (no throw, no swallow) when no onSaveResult is wired', async () => {
    (putFile as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network down'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    defineVimCommands(mockEditorRef as any, mockAuth, undefined, undefined);
    await getCallback('w')?.();
    // Allow the async chain to settle without throwing.
    await vi.waitFor(() => expect(putFile).toHaveBeenCalled());

    errorSpy.mockRestore();
  });
});
