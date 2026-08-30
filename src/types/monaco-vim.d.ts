// src/types/monaco-vim.d.ts

declare module 'monaco-vim' {
    import type * as monaco from 'monaco-editor';

    export interface VimModeInstance {
        dispose: () => void;
        on(event: 'vim-mode-change', listener: (mode: { mode: string; subMode?: string }) => void): void;
        on(event: string, listener: (...args: unknown[]) => void): void;
        attach(): void;
    }

    export interface VimApi {
        defineEx(name: string, prefix: string, fn: (cm: unknown) => void): void;
        handleKey(cm: VimModeInstance, key: string, origin?: string): void;
        exitInsertMode(cm: VimModeInstance): void;
        map(lhs: string, rhs: string, ctx?: string): void;
        unmap(lhs: string, ctx?: string): void;
    }

    export interface VimModeCtor {
        new (editor: monaco.editor.IStandaloneCodeEditor): VimModeInstance;
        Vim: VimApi;
    }

    export const VimMode: VimModeCtor;

    export function initVimMode(
        editor: monaco.editor.IStandaloneCodeEditor,
        statusBarContainer: HTMLElement
    ): VimModeInstance;
}