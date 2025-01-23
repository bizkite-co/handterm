declare module 'monaco-editor' {
  export interface IStandaloneCodeEditor {
    getValue(): string;
    focus(): void;
    getModel(): ITextModel | null;
    getPosition(): Position | null;
    dispose(): void;
  }

  export interface ITextModel {
    dispose(): void;
  }
}

declare global {
  interface Window {
    monaco: {
      editor: {
        createModel(value: string, language: string): import('monaco-editor').ITextModel;
        create(container: HTMLElement, options: unknown): import('monaco-editor').IStandaloneCodeEditor;
      };
    };
  }
}
