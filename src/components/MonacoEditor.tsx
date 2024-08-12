// src/components/MonacoEditor.tsx
import React, { useRef, useEffect } from 'react';
import Editor from "@monaco-editor/react";

interface MonacoEditorProps {
  initialValue: string;
  language: 'javascript' | 'typescript' | 'markdown';
  onChange?: (value: string | undefined) => void;
  onSave?: (value: string) => void;
  onClose?: () => void;
  height?: string;
}

declare global {
  interface Window {
    MonacoVim?: any;
    require: {
      config: (params: any) => void;
    };
  }
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({ initialValue, language, onChange, onSave, onClose, height = '90vh' }) => {
  const editorRef = useRef<any>(null);
  const statusNodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (window.MonacoVim) {
        window.MonacoVim.VimMode.Vim.dispose();
      }
    };
  }, []);

  function handleEditorDidMount(editor: any, monaco: any) {
    editorRef.current = editor;

    editor.addAction({
      id: "save-content",
      label: "Save Content",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S],
      run: function (editor: any) {
        if (onSave) {
          onSave(editor.getValue());
        }
        return null;
      }
    });

    window.require.config({
      paths: {
        "monaco-vim": "https://unpkg.com/monaco-vim/dist/monaco-vim"
      }
    });

    window.require(["monaco-vim"], (MonacoVim: any) => {
      if (statusNodeRef.current) {
        MonacoVim.initVimMode(editor, statusNodeRef.current);
      }

      // Define Vim commands
      const Vim = MonacoVim.VimMode.Vim;
      Vim.defineEx('w', '', () => {
        if (onSave) {
          onSave(editor.getValue());
        }
      });

      Vim.defineEx('q', '', () => {
        if (onClose) {
          onClose();
        }
      });

      Vim.defineEx('wq', '', () => {
        if (onSave) {
          onSave(editor.getValue());
        }
        if (onClose) {
          onClose();
        }
      });
    });
  }

  return (
    <div className="monaco-editor-container">
      <Editor
        height={height}
        defaultLanguage={language}
        defaultValue={initialValue}
        onMount={handleEditorDidMount}
        onChange={onChange}
        theme="vs-dark"
      />
      <div ref={statusNodeRef} className="status-node"></div>
    </div>
  );
};

export default MonacoEditor;
