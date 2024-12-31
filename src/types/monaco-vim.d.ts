// src/types/monaco-vim.d.ts

declare module 'monaco-vim' {
    import type * as monaco from 'monaco-editor';

    export function initVimMode(
        editor: monaco.editor.IStandaloneCodeEditor, statusBarContainer: HTMLElement
    ): { dispose: () => void };
}