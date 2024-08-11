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

// Custom type for the imperative handle
interface MonacoEditorHandle {
  focus: () => void;
  getValue: () => string;
}

const validateWorkerPath = async (url: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Worker file not found at ${url}`);
    } else {
      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('application/javascript')) {
        console.log(`Worker file found at ${url} and is a valid JavaScript file.`);
      } else {
        console.error(`Worker file at ${url} is not a JavaScript file but a ${contentType}`);
      }
    }
  } catch (error) {
    console.error(`Error fetching worker file at ${url}:`, error);
  }
};

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
      // Define MonacoEnvironment configuration to load workers
      (window as any).MonacoEnvironment = {
        getWorkerUrl: function (_moduleId: string, label: string) {
          let workerUrl = `/` + label + `.worker.bundle.js`;
          validateWorkerPath(workerUrl);
          return workerUrl;
        },
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