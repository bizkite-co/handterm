import { useRef, useEffect } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

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

      return () => {
        resizeObserver.disconnect();
        editorInstance?.dispose();
        const models = monaco.editor.getModels();
        models.forEach(model => model.dispose());
        editorRef.current = null;
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