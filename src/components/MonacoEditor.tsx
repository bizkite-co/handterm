// src/components/MonacoEditor.tsx
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as monaco from 'monaco-editor';
import { VimMode } from 'vim-monaco';
import './MonacoEditor.css'; // Ensure this file exists and has the required styles

interface MonacoEditorProps {
  initialValue: string;
  language: 'javascript' | 'typescript' | 'markdown';
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
  height?: string;
}

const MonacoEditor = forwardRef<any, MonacoEditorProps>(({ initialValue, language, onChange, onSave, height = '400px' }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const vimModeRef = useRef<VimMode | null>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      editorInstanceRef.current?.focus();
    },
    getValue: () => {
      return editorInstanceRef.current?.getValue();
    },
  }));

  useEffect(() => {
    const initializeEditor = async () => {
      await window.monacoReady;

      if (editorRef.current) {
        const editor = monaco.editor.create(editorRef.current, {
          value: initialValue,
          language: language,
          theme: 'vs-dark',
          automaticLayout: true,
        });

        editorInstanceRef.current = editor;

        console.log('Monaco Editor created:', editor);

        // Ensure VimMode is loaded after editor creation
        try {
          if (window.monaco) {
            console.log('window.monaco', window.monaco);
            const vimMode = new VimMode(editor);
            vimModeRef.current = vimMode;
          }
        } catch (error) {
          console.error('Error initializing VimMode:', error);
        }

        return () => {
          if (editorInstanceRef.current) {
            editorInstanceRef.current.dispose();
          }
        };
      }
    };

    initializeEditor();
  }, [initialValue, language]);

  return (
    <div>
      <div ref={editorRef} className="monaco-editor-container" style={{ height }} />
      <div id="status" className="vim-status-bar"></div>
    </div>
  );
});

export default MonacoEditor;