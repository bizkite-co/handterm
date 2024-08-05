// src/types/vim-monaco.d.ts
declare module 'vim-monaco' {
  import * as monaco from 'monaco-editor';

  export class VimMode {
    constructor(editor: monaco.editor.IStandaloneCodeEditor);
    dispose(): void;
    defineEx(cmd: string, defaultKey: string, callback: () => void): void;
  }
}