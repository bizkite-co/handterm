import type * as monaco from 'monaco-editor';

export interface IStandaloneCodeEditor extends monaco.editor.IStandaloneCodeEditor {}

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
