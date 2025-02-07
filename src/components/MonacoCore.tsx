import { useRef, useEffect } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import type { IStandaloneCodeEditor } from '@handterm/types/monaco';

interface MonacoCoreProps {
  value: string;
  language?: string;
}

export default function MonacoCore({ value, language = 'text' }: MonacoCoreProps): JSX.Element {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Editor initialization and cleanup
  useEffect(() => {
    if (!containerRef.current) return;

    let editorInstance: monaco.editor.IStandaloneCodeEditor | null = null;
    try {
      // Wait for monaco to be loaded
      if (!monaco.editor) {
        console.error('Monaco editor not loaded');
        return;
      }

      editorInstance = monaco.editor.create(containerRef.current, {
        value,
        language,
        minimap: { enabled: false },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        readOnly: false
      });

      // Handle window resize
      const resizeObserver = new ResizeObserver(() => {
        editorInstance?.layout();
      });
      resizeObserver.observe(containerRef.current);

      editorRef.current = editorInstance;
      window.monacoEditor = editorInstance;

      return () => {
        resizeObserver.disconnect();
        editorInstance?.dispose();
        editorRef.current = null;
        window.monacoEditor = null;
      };
    } catch (error) {
      console.error('Monaco editor initialization failed:', error);
      editorInstance?.dispose();
    }
  }, []);

  // Value synchronization
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const model = editor.getModel();
    if (model?.getValue() !== value) {
      editor.setValue(value);
    }
  }, [value]);

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />;
}
