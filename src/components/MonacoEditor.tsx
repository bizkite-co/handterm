// src/components/MonacoEditor.tsx
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as monaco from 'monaco-editor';
import { initVimMode } from 'monaco-vim';
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

      const statusBarContainer = document.createElement('div');
      const vimMode = initVimMode(editor, statusBarContainer);

      editor.onDidChangeModelContent(() => {
        if (onChange) {
          onChange(editor.getValue());
        }
      });

      // Function to define Vim commands
      const defineVimCommands = () => {
        const Vim = (window as any).Vim;
        if (Vim) {
          Vim.defineEx('w', '', () => {
            if (onSave) {
              onSave(editor.getValue());
            }
          });

          Vim.defineEx('q', '', () => {
            if (editorRef.current) {
              editorRef.current.style.display = 'none'; // Hide the editor
            }
          });

          Vim.defineEx('wq', '', () => {
            if (onSave) {
              onSave(editor.getValue());
            }
            if (editorRef.current) {
              editorRef.current.style.display = 'none'; // Hide the editor
            }
          });
        } else {
          console.error('Vim object is not available on the window');
        }
      };

      // Ensure Vim commands are defined after Vim mode is initialized
      // Retry every 100ms until Vim is available, up to a maximum of 10 retries
      let retries = 0;
      const maxRetries = 10;
      const intervalId = setInterval(() => {
        if ((window as any).Vim || retries >= maxRetries) {
          clearInterval(intervalId);
          if ((window as any).Vim) {
            defineVimCommands();
          } else {
            console.error('Vim object was not available after maximum retries');
          }
        }
        retries++;
      }, 100);

      return () => {
        vimMode.dispose();
        editor.dispose();
      };
    }
  }, [initialValue, language, onChange, onSave]);

  return <div ref={editorRef} className="monaco-editor-container" style={{ height }} />;
});

export default MonacoEditor;