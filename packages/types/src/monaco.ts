import type * as Monaco from 'monaco-editor';

export type IDisposable = Monaco.IDisposable;
export type IStandaloneCodeEditor = Monaco.editor.IStandaloneCodeEditor;
export type ITextModel = Monaco.editor.ITextModel;
export type IActionDescriptor = Monaco.editor.IActionDescriptor;
export type KeyCode = Monaco.KeyCode;
export type KeyMod = Monaco.KeyMod;

declare global {
  interface Window {
    monaco?: {
      editor: {
        onDidCreateEditor: (callback: (editor: IStandaloneCodeEditor) => void) => IDisposable
      }
    }
  }
}

export function isMonacoWindow(window: Window): boolean {
  return typeof window.monaco !== 'undefined';
}

export async function withTempEditor<T>(
  callback: (editor: IStandaloneCodeEditor) => T
): Promise<T> {
  if (!window.monaco) {
    throw new Error('Monaco editor not available');
  }

  const editor = await new Promise<IStandaloneCodeEditor>((resolve) => {
    const disposable = window.monaco!.editor.onDidCreateEditor((editor) => {
      disposable.dispose();
      resolve(editor);
    });
  });
  return callback(editor);
}