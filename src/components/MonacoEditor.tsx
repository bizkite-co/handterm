// src/components/MonacoEditor.tsx
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as monaco from 'monaco-editor';
import './MonacoEditor.css'; // Import the CSS file

interface MonacoEditorProps {
  initialValue: string;
  language: 'javascript' | 'typescript' | 'markdown';
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
  height?: string;
}

interface MonacoEditorHandle {
  focus: () => void;
  getValue: () => string;
}

const MonacoEditor = forwardRef<MonacoEditorHandle, MonacoEditorProps>(
  ({ initialValue, language, onChange, onSave, height = '90vh' }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const vimModeRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        monacoEditorRef.current?.focus();
      },
      getValue: () => {
        return monacoEditorRef.current?.getValue() || ''; // Provide a default value
      },
    }));

    useEffect(() => {
      (window as any).MonacoEnvironment = {
        getWorker: function (_moduleId: string, label: string) {
          if (label === 'json') {
            return new Worker(new URL('monaco-editor/esm/vs/language/json/json.worker.js', import.meta.url), { type: 'module' });
          } else if (label === 'css') {
            return new Worker(new URL('monaco-editor/esm/vs/language/css/css.worker.js', import.meta.url), { type: 'module' });
          } else if (label === 'html') {
            return new Worker(new URL('monaco-editor/esm/vs/language/html/html.worker.js', import.meta.url), { type: 'module' });
          } else if (label === 'typescript' || label === 'javascript') {
            return new Worker(new URL('monaco-editor/esm/vs/language/typescript/ts.worker.js', import.meta.url), { type: 'module' });
          } else {
            return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' });
          }
        }
      };

      const loadMonacoEditor = async () => {
        const { initVimMode } = await import('monaco-vim');

        if (editorRef.current) {
          const editor = monaco.editor.create(editorRef.current, {
            value: initialValue,
            language: language,
            theme: 'vs-dark',
            automaticLayout: true,
          });

          monacoEditorRef.current = editor;

          const statusBarContainer = document.createElement('div');
          statusBarContainer.className = 'status-node';
          document.body.appendChild(statusBarContainer);

          if (!vimModeRef.current) {
            vimModeRef.current = initVimMode(editor, statusBarContainer);
          }

          editor.onDidChangeModelContent(() => {
            if (onChange) {
              onChange(editor.getValue());
            }
          });

          // Define Vim commands only once
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

          // Ensure Vim commands are defined only once
          if (!(window as any)._vimCommandsDefined) {
            (window as any)._vimCommandsDefined = true;
            defineVimCommands();
          }

          // Clean up function
          return () => {
            if (vimModeRef.current) vimModeRef.current.dispose();
            if (monacoEditorRef.current) monacoEditorRef.current.dispose();
            if (statusBarContainer && statusBarContainer.parentNode) {
              statusBarContainer.parentNode.removeChild(statusBarContainer);
            }
          };
        }
      };

      loadMonacoEditor();

      return () => {
        if (vimModeRef.current) vimModeRef.current.dispose();
        if (monacoEditorRef.current) monacoEditorRef.current.dispose();
      };
    }, [initialValue, language, onChange, onSave]);

    return <div ref={editorRef} className="monaco-editor-container" style={{ height }} />;
  }
);

export default MonacoEditor;