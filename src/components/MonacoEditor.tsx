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
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<Monaco | null>(null);
    const vimModeRef = useRef<{ dispose: () => void } | null>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        editorRef.current?.focus();
      },
      getValue: () => {
        return editorRef.current?.getValue() ?? ''; // Use nullish coalescing for default value
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

      // setup key bindings before monaco-vim setup

      // setup key bindings
      editor.addAction({
        // an unique identifier of the contributed action
        id: "some-unique-id",
        // a label of the action that will be presented to the user
        label: "Some label!",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S],

        // the method that will be executed when the action is triggered.
        run: function (editor) {
          if (onSave) {
            onSave(editor.getValue());
          }
          return null;
        }
      });

      // setup monaco-vim
      window.require.config({
        paths: {
          "monaco-vim": "https://unpkg.com/monaco-vim/dist/monaco-vim"
        }
      });

      window.require(["monaco-vim"], function (MonacoVim) {
        const statusNode = document.createElement('div');
        vimModeRef.current = MonacoVim.initVimMode(editor, statusNode);

        // Define Vim commands
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
      });
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
