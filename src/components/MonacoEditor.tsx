// src/components/MonacoEditor.tsx
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as monaco from 'monaco-editor';
import { VimMode } from 'vim-monaco';
import './MonacoEditor.css'; // Import the CSS file

interface MonacoEditorProps {
  initialValue: string;
  language: 'javascript' | 'typescript' | 'markdown';
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
  height?: string;
}

// Configure Monaco environment
if (typeof window !== 'undefined') {
  (window as any).MonacoEnvironment = {
    getWorkerUrl: function (_moduleId: string, label: string) {
      if (label === 'json') {
        return '/json.worker.js';
      }
      if (label === 'css') {
        return '/css.worker.js';
      }
      if (label === 'html') {
        return '/html.worker.js';
      }
      if (label === 'typescript' || label === 'javascript') {
        return '/ts.worker.js';
      }
      return '/editor.worker.js';
    },
  };
}

const MonacoEditor = forwardRef<any, MonacoEditorProps>(({ initialValue, language, onChange, onSave, height = '400px' }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const vimModeRef = useRef<VimMode | null>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      monacoEditorRef.current?.focus();
    },
    getValue: () => {
      return monacoEditorRef.current?.getValue();
    },
  }));

  useEffect(() => {
    if (editorRef.current) {
      const editor = monaco.editor.create(editorRef.current, {
        value: initialValue,
        language: language,
        theme: 'vs-dark',
        automaticLayout: true,
      });

      monacoEditorRef.current = editor;

      editor.onDidChangeModelContent(() => {
        if (onChange) {
          onChange(editor.getValue());
        }
      });

      const initializeVimMode = () => {
        try {
          const vimMode = new VimMode(editor);
          vimModeRef.current = vimMode;

          // Define Vim commands
          vimMode.defineEx('w', '', () => {
            if (onSave) {
              onSave(editor.getValue());
            }
          });

          vimMode.defineEx('q', '', () => {
            if (editorRef.current) {
              editorRef.current.style.display = 'none'; // Hide the editor
            }
          });

          vimMode.defineEx('wq', '', () => {
            if (onSave) {
              onSave(editor.getValue());
            }
            if (editorRef.current) {
              editorRef.current.style.display = 'none'; // Hide the editor
            }
          });

        } catch (error) {
          console.error('Error initializing VimMode:', error);
        }
      };

      // Delay initialization to ensure the editor is fully loaded
      setTimeout(initializeVimMode, 2000);

      return () => {
        if (vimModeRef.current) {
          vimModeRef.current.dispose();
        }
        editor.dispose();
      };
    }
  }, [initialValue, language, onChange, onSave]);

  return (
    <div>
      <div ref={editorRef} className="monaco-editor-container" style={{ height }} />
      <div id="status" className="vim-status-bar"></div>
    </div>
  );
});

export default MonacoEditor;