import { useEffect, useState, useCallback, useMemo } from 'react';
import type { ITerminalAdapter, IStandaloneCodeEditor } from '@handterm/types';
import type { IDisposable } from 'packages/types/src/monaco';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

export const useMonacoTerminal = (editor: IStandaloneCodeEditor | null): ITerminalAdapter => {
  const [model, setModel] = useState<monaco.editor.ITextModel | null>(null);
  const [onDataCallbacks, setOnDataCallbacks] = useState<((data: string) => void)[]>([]);
  const [onResizeCallbacks, setOnResizeCallbacks] = useState<((size: { cols: number; rows: number }) => void)[]>([]);

  useEffect(() => {
    if (editor) {
      const newModel = monaco.editor.createModel('', 'plaintext');
      editor.setModel(newModel);
      setModel(newModel);

      const disposable = editor.onDidChangeModelContent((event: monaco.editor.IModelContentChangedEvent) => {
        const lastChange = event.changes[event.changes.length - 1];
        if (lastChange && lastChange.text.length > 0) {
          onDataCallbacks.forEach(callback => callback(lastChange.text));
        }
      });

      return () => {
        disposable.dispose();
        newModel.dispose();
      };
    }
    return () => {};
  }, [editor, onDataCallbacks]);

  const write = useCallback((data: string) => {
    if (model && editor) {
      const currentContent = model.getValue();
      model.setValue(currentContent + data);
      editor.revealLine(model.getLineCount());
    }
  }, [model, editor]);

  const clear = useCallback(() => {
    if (model) {
      model.setValue('');
    }
  }, [model]);

  const focus = useCallback(() => {
    editor?.focus();
  }, [editor]);

  const onData = useCallback((callback: (data: string) => void): IDisposable => {
    setOnDataCallbacks(prev => [...prev, callback]);
    return {
      dispose: () => {
        setOnDataCallbacks(prev => prev.filter(cb => cb !== callback));
      },
    };
  }, []);

  const onResize = useCallback((callback: (size: { cols: number; rows: number }) => void): IDisposable => {
    setOnResizeCallbacks(prev => [...prev, callback]);
    return {
      dispose: () => {
        setOnResizeCallbacks(prev => prev.filter(cb => cb !== callback));
      },
    };
  }, []);

  const fit = useCallback(() => {
    if (editor) {
      editor.layout();
      // Monaco doesn't have a direct 'fit' method like xterm.js.
      // Layouting should handle most of it.
      // If specific column/row calculation is needed, it would go here.
    }
  }, [editor]);

  const proposeGeometry = useCallback(() => {
    if (editor) {
      const container = editor.getContainerDomNode();
      if (container) {
        const fontInfo = editor.getOption(monaco.editor.EditorOption.fontInfo);
        const lineHeight = fontInfo.lineHeight;
        const charWidth = fontInfo.typicalHalfwidthCharacterWidth;

        const rows = Math.floor(container.clientHeight / lineHeight);
        const cols = Math.floor(container.clientWidth / charWidth);

        return { cols, rows };
      }
    }
    return null;
  }, [editor]);

  return useMemo(() => ({
    write,
    clear,
    focus,
    onData,
    onResize,
    fit,
    proposeGeometry,
  }), [write, clear, focus, onData, onResize, fit, proposeGeometry]);
};