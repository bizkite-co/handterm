// src/components/MonacoEditor.tsx
import React, { useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import './MonacoEditor.css'; // Import the CSS file
import { initVimMode } from 'monaco-vim';

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
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<Monaco | null>(null);
    const vimModeRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        editorRef.current?.focus();
      },
      getValue: () => {
        return editorRef.current?.getValue() || ''; // Provide a default value
      },
    }));

    useEffect(() => {
      return () => {
        if (vimModeRef.current) {
          vimModeRef.current.dispose();
        }
      };
    }, []);

    const handleEditorDidMount = (editor: any, monaco: Monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      window.require.config({
        paths: {
          "monaco-vim": "https://unpkg.com/monaco-vim/dist/monaco-vim"
        }
      });

      window.require(["monaco-vim"], function (MonacoVim) {
        if (!vimModeRef.current) {
          vimModeRef.current = MonacoVim.initVimMode(editor, document.createElement('div'));
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
    };

    return (
      <Editor
        height={height}
        defaultLanguage={language}
        defaultValue={initialValue}
        onMount={handleEditorDidMount}
        onChange={onChange}
        theme="vs-dark"
      />
    );
  }
);

export default MonacoEditor;
