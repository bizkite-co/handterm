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

      // Initialize Vim mode with error handling
      try {
        const vimMode = new VimMode(editor);
        vimModeRef.current = vimMode;

        // Define Vim commands
        const defineVimCommands = () => {
          if (vimMode) {
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
          } else {
            console.error('VimMode object is not available');
          }
        };

        defineVimCommands();

      } catch (error) {
        console.error('Error initializing VimMode:', error);
      }

      editor.onDidChangeModelContent(() => {
        if (onChange) {
          onChange(editor.getValue());
        }
      });

      return () => {
        if (vimModeRef.current) {
          vimModeRef.current.dispose();
        }
        editor.dispose();
      };
    }
  }, [initialValue, language, onChange, onSave]);

  return <div ref={editorRef} className="monaco-editor-container" style={{ height }} />;
});

export default MonacoEditor;