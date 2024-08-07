// src/components/MonacoEditor.tsx
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as monaco from 'monaco-editor';
import './MonacoEditor.css'; // Import the CSS file

interface MonacoEditorProps {
  initialValue: string;
  language: 'javascript' | 'typescript' | 'markdown';
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
  height?: string;
}

// Custom type for the imperative handle
interface MonacoEditorHandle {
  focus: () => void;
  getValue: () => string;
}

const MonacoEditor = forwardRef<MonacoEditorHandle, MonacoEditorProps>(
  ({ initialValue, language, onChange, onSave, height = "90vh" }, ref) => {
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
      // Define MonacoEnvironment to load workers
      (window as any).MonacoEnvironment = {
        getWorkerUrl: function (_moduleId: string, label: string) {
          if (label === 'json') {
            return '/json.worker.bundle.js';
          }
          if (label === 'css') {
            return '/css.worker.bundle.js';
          }
          if (label === 'html') {
            return '/html.worker.bundle.js';
          }
          if (label === 'typescript' || label === 'javascript') {
            return '/ts.worker.bundle.js';
          }
          return '/editor.worker.bundle.js';
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

          const defineVimCommands = async () => {
            await new Promise<void>((resolve) => {
              const checkVim = () => {
                if ((window as any).Vim) {
                  resolve();
                } else {
                  setTimeout(checkVim, 100);
                }
              };
              checkVim();
            });

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

          // Define Vim commands after ensuring Vim object is available
          defineVimCommands();

          return () => {
            if (vimModeRef.current) vimModeRef.current.dispose();
            editor.dispose();
            if (statusBarContainer && statusBarContainer.parentNode) {
              statusBarContainer.parentNode.removeChild(statusBarContainer);
            }
          };
        }
      };

      loadMonacoEditor();

      return () => {
        // Cleanup function
        if (vimModeRef.current) vimModeRef.current.dispose();
        if (monacoEditorRef.current) monacoEditorRef.current.dispose();
      };
    }, [initialValue, language, onChange, onSave]);

    return <div ref={editorRef} className="monaco-editor-container" style={{ height }} />;
  }
);

export default MonacoEditor;