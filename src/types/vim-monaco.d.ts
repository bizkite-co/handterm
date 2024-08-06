// types/vim-monaco.d.ts
declare module 'vim-monaco' {
  import * as monaco from 'monaco-editor';

  export class VimMode {
    constructor(editor: monaco.editor.IStandaloneCodeEditor);
    dispose(): void;
  }

  export function makeDomStatusBar(parent: HTMLElement, focusEditor: () => void): HTMLElement;
}