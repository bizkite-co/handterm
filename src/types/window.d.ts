import type { ComponentType, ReactNode } from 'react';
import type * as ReactTypes from 'react';
import type * as ReactDOMTypes from 'react-dom/client';
import type * as MonacoTypes from 'monaco-editor';

interface ReactDOMInstance {
  createRoot: (container: Element | DocumentFragment) => {
    render: (element: ReactNode) => void;
    unmount: () => void;
  };
}

interface MonacoEditorProps {
  isTreeView: boolean;
  height: string;
  initialValue: string;
  language: string;
  onMount?: (editor: MonacoTypes.editor.IStandaloneCodeEditor) => void;
}

declare global {
  interface Window {
    React: typeof ReactTypes;
    ReactDOM: ReactDOMInstance & typeof ReactDOMTypes;
    MonacoEditor: ComponentType<MonacoEditorProps>;
    monaco: typeof MonacoTypes;
    monacoEditor?: MonacoTypes.editor.IStandaloneCodeEditor & {
      getValue(): string;
      setValue(value: string): void;
      focus(): void;
      updateOptions(options: Record<string, unknown>): void;
      onDidChangeModelContent(listener: (e: unknown) => void): void;
      getModel(): {
        getValue(): string;
        setValue(value: string): void;
      } | null;
    };
  }
}

export {}; // Ensure this is treated as a module
