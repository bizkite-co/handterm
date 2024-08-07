// src/components/MonacoEditor.tsx
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as monaco from 'monaco-editor';
import { VimMode, IStatusBar } from 'vim-monaco';  // Import types from vim-monaco
import './MonacoEditor.css';

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
    const statusBarRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        editorInstanceRef.current?.focus();
      },
      getValue: () => {
        return editorInstanceRef.current?.getValue();
      },
    }));

    useEffect(() => {
      if (editorRef.current) {
        if (!editorRef.current) return;
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
          if (statusBarRef.current) {
            const statusBar: IStatusBar = {
              // setText: (text: string) => {
              //   if (statusBarRef.current) {
              //     statusBarRef.current.textContent = text;
              //   }
              // },
              // setError: (text: string) => {
              //   if (statusBarRef.current) {
              //     statusBarRef.current.textContent = text;
              //     statusBarRef.current.style.color = 'red';
              //   }
              // },
              // setCursor: (text: string) => {
              //   if (statusBarRef.current) {
              //     statusBarRef.current.textContent = text;
              //   }
              
              clear: () => {
                if (statusBarRef.current) {
                  statusBarRef.current.textContent = '';
                  statusBarRef.current.style.color = 'inherit';
                }
              },
            };

            const vimMode = new VimMode(editor, statusBar);
            vimModeRef.current = vimMode;
            console.log('VimMode created:', vimMode);
          } else {
            console.error('Status bar container not found');
          }
        } catch (error) {
          console.error('Error initializing VimMode:', error);
        }

        // Handle editor content change
        editor.onDidChangeModelContent(() => {
          if (onChange) {
            onChange(editor.getValue());
          }
        });

        return () => {
          if (editorInstanceRef.current) {
            editorInstanceRef.current.dispose();
          }
        };
      }
    }, [initialValue, language]);

    return (
      <div>
        <div ref={editorRef} className="monaco-editor-container" style={{ height }} />
        <div ref={statusBarRef} id="status" className="vim-status-bar"></div>
      </div>
    );
  });

export default MonacoEditor;