import type * as monaco from 'monaco-editor';

declare module 'vite-plugin-cross-origin-isolation';

interface Window {
  monacoEditor: monaco.editor.IStandaloneCodeEditor | undefined;
}