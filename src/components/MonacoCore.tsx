import { useRef, useEffect, useState } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { initVimMode } from 'monaco-vim';
import { ActivityType, StorageKeys } from '@handterm/types';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MonacoVim?: any;
    setActivity: (activity: ActivityType) => void;
  }
}

/*
  Refer to EditorOptions
  https://microsoft.github.io/monaco-editor/typedoc/variables/editor.EditorOptions.html
*/
interface MonacoCoreProps {
  value: string;
  language?: string;
  toggleVideo?: () => boolean;
}

export default function MonacoCore({ value, language = 'text', toggleVideo }: MonacoCoreProps): JSX.Element {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const statusBarRef = useRef<HTMLDivElement>(null);
  const [containerStyle, setContainerStyle] = useState({ flexGrow: 1, height: '1000px' });

  // Editor initialization and cleanup
  useEffect(() => {
    if (!containerRef.current || !statusBarRef.current) return;

    let editorInstance: monaco.editor.IStandaloneCodeEditor | null = null;
    let vimMode: { dispose: () => void } | null = null;

    try {
      editorInstance = monaco.editor.create(containerRef.current, {
        value,
        language,
        minimap: { enabled: false },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        readOnly: false,
        theme: 'vs-dark',
        scrollbar: {
          horizontal: 'hidden',
          vertical: 'hidden'
        },
        lineNumbersMinChars: 2,
      });
      window.monacoEditor = editorInstance;
      // editorRef.current = editorInstance; // Moved back down
      // editorInstance.focus(); // Moved back down

      // Remove explicit height after editor creation
      setContainerStyle({ flexGrow: 1, height: 'auto' });

      // Initialize Vim mode and get Vim object
      vimMode = initVimMode(editorInstance, statusBarRef.current);
      editorInstance.focus(); // Put focus back here
      editorRef.current = editorInstance;


      // Define Vim commands after a short delay to ensure VimMode is initialized
      setTimeout(() => {
        if (window.MonacoVim && window.MonacoVim.VimMode && window.MonacoVim.VimMode.Vim) {
          const Vim = window.MonacoVim.VimMode.Vim;

          Vim.defineEx('w', '', () => {
            if (editorRef.current) {
              const content = editorRef.current.getValue();
              localStorage.setItem(StorageKeys.editContent, JSON.stringify(content));
            }
          });

          Vim.defineEx('q', '', () => {
            if (typeof window.setActivity === 'function') {
              window.setActivity(ActivityType.NORMAL);
            }
            localStorage.removeItem(StorageKeys.editContent);
          });

          Vim.defineEx('q!', '', () => {
            if (typeof window.setActivity === 'function') {
              window.setActivity(ActivityType.NORMAL);
            }
            localStorage.removeItem(StorageKeys.editContent);
          });

          Vim.defineEx('wq', '', () => {
            if (editorRef.current) {
              const content = editorRef.current.getValue();
              localStorage.setItem(StorageKeys.editContent, JSON.stringify(content));
            }
            if (typeof window.setActivity === 'function') {
              window.setActivity(ActivityType.NORMAL);
            }
            localStorage.removeItem(StorageKeys.editContent);
          });
          Vim.defineEx('vid', '', () => {
            if (toggleVideo) {
              toggleVideo();
            }
          });
        } else {
          console.error('MonacoVim not initialized properly.');
          if (statusBarRef.current) {
              console.log("Status Bar Text:", statusBarRef.current.textContent);
          }
        }
      }, 1000); // Delay 1000ms to ensure VimMode is initialized

      // Handle window resize
      const resizeObserver = new ResizeObserver(() => {
        editorInstance?.layout();
      });
      resizeObserver.observe(containerRef.current);


      return () => {
        resizeObserver.disconnect();
        vimMode?.dispose();
        editorInstance?.dispose();
        editorRef.current = null;
      };
    } catch (error) {
      console.error('Monaco editor initialization failed:', error);
    }
  }, [language, value, toggleVideo]);

  // Type guard for ITextModel
  function isTextModel(model: monaco.editor.ITextModel | null): model is monaco.editor.ITextModel {
    return model !== null && typeof model.getValue === 'function';
  }

  // Value synchronization
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const model = editor.getModel();
    if (isTextModel(model) && model.getValue() !== value) {
      editor.setValue(value);
    }
  }, [value]);

  return (
    <div data-testid="monaco-editor-container" className="monaco-editor-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div ref={containerRef} style={containerStyle} />
      <div ref={statusBarRef} className="vim-status-bar" style={{ height: '20px' }} />
    </div>
  );
}
