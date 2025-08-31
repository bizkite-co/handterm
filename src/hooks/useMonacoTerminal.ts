import { useRef, useEffect, useState, useCallback } from 'react';
import type { ITerminalAdapter } from '../types/terminal';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

export const useMonacoTerminal = (): ITerminalAdapter => {
  const ref = useRef<HTMLDivElement>(null);
  const [monacoEditor, setMonacoEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [model, setModel] = useState<monaco.editor.ITextModel | null>(null);
  const onDataCallbacks = useRef<((data: string) => void)[]>([]);

  useEffect(() => {
    if (ref.current && !monacoEditor) {
      const newEditor = monaco.editor.create(ref.current, {
        value: '',
        language: 'plaintext',
        readOnly: false, // Will manage read-only state for output/input
        minimap: { enabled: false },
        lineNumbers: 'off',
        glyphMargin: false,
        folding: false,
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        scrollbar: {
          vertical: 'hidden',
          horizontal: 'hidden',
        },
        // Disable editor features not needed for a terminal
        contextmenu: false,
        quickSuggestions: false,
        suggestOnTriggerCharacters: false,
        hover: { enabled: false },
        links: false,
        // Further customization for terminal-like behavior
        renderLineHighlight: 'none',
        cursorStyle: 'block',
        fontFamily: 'monospace',
        fontSize: 14,
      });

      const newModel = monaco.editor.createModel('', 'plaintext');
      newEditor.setModel(newModel);
      setMonacoEditor(newEditor);
      setModel(newModel);

      // Handle input from Monaco Editor
      newEditor.onDidChangeModelContent((event) => {
        const lastChange = event.changes[event.changes.length - 1];
        if (lastChange && lastChange.text.length > 0) {
          onDataCallbacks.current.forEach(callback => callback(lastChange.text));
        }
      });

      return () => {
        newEditor.dispose();
        newModel.dispose();
      };
    }
    // Ensure a cleanup function is always returned
    return () => {};
  }, [ref, monacoEditor]);

  const write = useCallback((data: string) => {
    if (model) {
      const currentContent = model.getValue();
      model.setValue(currentContent + data);
      // Scroll to bottom
      if (monacoEditor) {
        monacoEditor.revealLine(model.getLineCount());
      }
    }
  }, [model, monacoEditor]);

  const resetPrompt = useCallback(() => {
    // This will be more complex when we have a proper prompt management
    if (model) {
      model.setValue(''); // Clear all content for now
    }
  }, [model]);

  const focus = useCallback(() => {
    monacoEditor?.focus();
  }, [monacoEditor]);

  const onData = useCallback((callback: (data: string) => void) => {
    onDataCallbacks.current.push(callback);
    return {
      dispose: () => {
        onDataCallbacks.current = onDataCallbacks.current.filter(cb => cb !== callback);
      },
    };
  }, []);

  return {
    ref,
    write,
    resetPrompt,
    focus,
    onData,
  };
};