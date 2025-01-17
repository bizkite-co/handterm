import type * as monaco from 'monaco-editor';

export interface IStandaloneCodeEditor extends monaco.editor.IStandaloneCodeEditor {
  onFileSelect?: (path: string) => void;
}

export interface IDisposable {
  dispose(): void;
}

export interface ITextModel {
  getLineCount(): number;
}

export interface IPosition {
  lineNumber: number;
  column: number;
}

declare global {
  interface Window {
    monacoEditor: IStandaloneCodeEditor;
    __fileSelectHandler?: jest.Mock;
    selectedFilePath?: string;
  }
}
