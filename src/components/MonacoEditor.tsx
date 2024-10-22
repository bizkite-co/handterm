// src/components/MonacoEditor.tsx
import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import Editor from "@monaco-editor/react";
import { useReactiveLocation } from 'src/hooks/useReactiveLocation';
import { ActivityType } from 'src/types/Types';

interface MonacoEditorProps {
  initialValue: string;
  language: 'javascript' | 'typescript' | 'markdown';
  onClose?: () => void;
  height?: string;
  toggleVideo?: () => boolean;
}

declare global {
  interface Window {
    MonacoVim?: any;
    require: {
      config: (params: any) => void;
    };
  }
}

export interface MonacoEditorHandle {
  focus: () => void;
}

const handleEditSave = (value?: string): void => {
  localStorage.setItem('edit-content', JSON.stringify(value));
}

const MonacoEditor = forwardRef<MonacoEditorHandle, MonacoEditorProps>(({ initialValue, language, onClose, height = '80vh', toggleVideo }, ref) => {
  const editorRef = useRef<any>(null);
  const statusNodeRef = useRef<HTMLDivElement>(null);
  const { parseLocation, updateLocation } = useReactiveLocation();

  const handleEditorClose = (): void => {
    updateLocation({
      activity: ActivityType.NORMAL,
      contentKey: null,
      groupKey: null
    })
  }

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }
  }));

  useEffect(() => {
    return () => {
      if (window.MonacoVim) {
        window.MonacoVim.VimMode.Vim.dispose();
      }
    };
  }, []);

  function handleEditorDidMount(editor: any, monaco: any) {
    editorRef.current = editor;
    setTimeout(() => editor.focus(), 100);

    editor.addAction({
      id: "save-content",
      label: "Save Content",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S],
      run: function (editor: any) {
        handleEditSave(editor.getValue());
        return null;
      }
    });

    window.require.config({
      paths: {
        "monaco-vim": "https://unpkg.com/monaco-vim/dist/monaco-vim"
      }
    });


    // @ts-ignore
    window.require(["monaco-vim"], (MonacoVim: any) => {
      if (statusNodeRef.current) {
        MonacoVim.initVimMode(editor, statusNodeRef.current);
      }

      // Define Vim commands
      const Vim = MonacoVim.VimMode.Vim;
      Vim.defineEx('w', '', () => {
        handleEditSave(editor.getValue());
      });

      Vim.defineEx('q', '', () => {
        if (onClose) {
          onClose();
        }
      });
      Vim.defineEx('wq', '', () => {
        handleEditSave(editor.getValue());
        if (onClose) {
          onClose();
        }
      })

      Vim.defineEx('vid', '', () => {
        if (toggleVideo) {
          toggleVideo();
        }
      });
    });
  }

  return (
    <div className="monaco-editor-container">
      <Editor
        key={language}
        height={height}
        defaultLanguage={language}
        defaultValue={initialValue}
        onMount={handleEditorDidMount}
        onChange={handleEditSave}
        theme="vs-dark"
      />
      <div ref={statusNodeRef} className="status-node"></div>
    </div>
  );
});

export default MonacoEditor;
