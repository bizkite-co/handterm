import type * as monaco from 'monaco-editor';

export type IDisposable = monaco.IDisposable;
export type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
export type ITextModel = monaco.editor.ITextModel;
export type IActionDescriptor = monaco.editor.IActionDescriptor;
export type KeyCode = monaco.KeyCode;
export type KeyMod = monaco.KeyMod;

declare global {
  interface Window {
    monacoEditor?: IStandaloneCodeEditor;
    monaco?: typeof monaco;
  }
}

export function isMonacoWindow(window: Window): window is Window & { monaco: typeof monaco } {
  return typeof window.monaco !== 'undefined';
}

export async function withTempEditor<T>(
  callback: (editor: IStandaloneCodeEditor) => T
): Promise<T> {
  if (!window.monaco) {
    throw new Error('Monaco editor not available');
  }

  const monaco = window.monaco;
  const editor = await new Promise<IStandaloneCodeEditor>((resolve) => {
    const disposable = monaco.editor.onDidCreateEditor((codeEditor) => {
      disposable.dispose();
      // We know this is a standalone editor in our context
      resolve(codeEditor as unknown as IStandaloneCodeEditor);
    });
  });
  return callback(editor);
}
