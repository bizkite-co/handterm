import type { IStandaloneCodeEditor } from 'monaco-editor';

declare global {
  interface Window {
    monacoEditor: IStandaloneCodeEditor | null;
  }
}
