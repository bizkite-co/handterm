// src/components/MonacoEditor.tsx
import React, { useRef, useEffect } from 'react';
import Editor from "@monaco-editor/react";

interface MonacoEditorProps {
  initialValue: string;
  language: 'javascript' | 'typescript' | 'markdown';
  onChange?: (value: string | undefined) => void;
  onSave?: (value: string) => void;
  height?: string;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({ initialValue, language, onChange, onSave, height = '90vh' }) => {
  const editorRef = useRef<any>(null);

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

    window.require(["monaco-vim"], function (MonacoVim: any) {
      const statusNode = document.querySelector(".status-node") || document.createElement("div");
      if (!document.body.contains(statusNode)) {
        statusNode.className = "status-node";
        document.body.appendChild(statusNode);
      }
      MonacoVim.initVimMode(editor, statusNode);

      // Define Vim commands
      const Vim = MonacoVim.VimMode.Vim;
      Vim.defineEx('w', '', () => {
        if (onSave) {
          onSave(editor.getValue());
        }
      });

      Vim.defineEx('q', '', () => {
        editor.getContainerDomNode().style.display = 'none';
      });

      Vim.defineEx('wq', '', () => {
        if (onSave) {
          onSave(editor.getValue());
        }
        editor.getContainerDomNode().style.display = 'none';
      });
    });
  }

  return (
    <>
      <Editor
        height={height}
        defaultLanguage={language}
        defaultValue={initialValue}
        onMount={handleEditorDidMount}
        onChange={onChange}
        theme="vs-dark"
      />
      <div className="status-node"></div>
    </>
  );
};

export default MonacoEditor;
