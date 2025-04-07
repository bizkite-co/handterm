import { useRef, useEffect, useState } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { initVimMode } from 'monaco-vim'; // Restore
import { ActivityType, StorageKeys, type IStandaloneCodeEditor } from '@handterm/types'; // Import IStandaloneCodeEditor
import { navigate } from '../utils/navigationUtils';
import type { JSX } from 'react';

// REMOVED declare global block - types should come from packages/types/src/window.ts

/*
  Refer to EditorOptions
  https://microsoft.github.io/monaco-editor/typedoc/variables/editor.EditorOptions.html
*/
interface MonacoCoreProps {
  value: string;
  language?: string;
  toggleVideo?: () => boolean;
}

// Type assertion for window to access MonacoVim if needed, assuming it's attached globally elsewhere
type WindowWithVim = Window & { MonacoVim?: any };

export function defineVimCommands(editorRef: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>, window: WindowWithVim, toggleVideo?: () => boolean) {
    console.log("Attempting to define Vim commands...");
    if (window.MonacoVim && window.MonacoVim.VimMode && window.MonacoVim.VimMode.Vim) { // Restore check
        const Vim = window.MonacoVim.VimMode.Vim;
        console.log("Vim API found. Defining commands.");

        Vim.defineEx('w', '', () => {
        if (editorRef.current) {
            const content = editorRef.current.getValue();
            localStorage.setItem(StorageKeys.editContent, JSON.stringify(content));
        }
        });

        Vim.defineEx('q', '', () => {
        console.log('[MonacoCore] :q command triggered. Calling navigate...');
        navigate({ activityKey: ActivityType.NORMAL });
        console.log('[MonacoCore] :q command: navigate called. Removing editContent from localStorage.');
        localStorage.removeItem(StorageKeys.editContent);
        });

        Vim.defineEx('q!', '', () => {
          console.log('[MonacoCore] :q! command triggered. Calling navigate...');
          navigate({ activityKey: ActivityType.NORMAL });
          console.log('[MonacoCore] :q! command: navigate called. Removing editContent from localStorage.');
          localStorage.removeItem(StorageKeys.editContent);
        });

        Vim.defineEx('wq', '', () => {
        if (editorRef.current) {
            const content = editorRef.current.getValue();
            localStorage.setItem(StorageKeys.editContent, JSON.stringify(content));
        }
        navigate({ activityKey: ActivityType.NORMAL });
        localStorage.removeItem(StorageKeys.editContent);
        });
        Vim.defineEx('vid', '', () => {
        if (toggleVideo) {
            toggleVideo();
        }
        });
        console.log("Vim commands defined successfully.");
    } else { // Restore else
        console.error('MonacoVim not initialized properly when trying to define commands.');
    } // Restore else
}

export default function MonacoCore({ value, language = 'text', toggleVideo }: MonacoCoreProps): JSX.Element {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const statusBarRef = useRef<HTMLDivElement>(null); // Restore ref
  const [containerStyle, setContainerStyle] = useState({ flexGrow: 1, height: 'auto' });

  // Editor initialization and cleanup
  useEffect(() => {
    // Restore status bar ref check
    if (!containerRef.current || !statusBarRef.current) {
        console.warn("MonacoCore: Container or status bar ref not available yet.");
        return;
    }
    console.log("MonacoCore: Refs are available. Proceeding with initialization.");
    console.log("MonacoCore: containerRef.current:", containerRef.current);
    console.log("MonacoCore: statusBarRef.current:", statusBarRef.current); // Restore log


    let editorInstance: monaco.editor.IStandaloneCodeEditor | null = null;
    let vimMode: { dispose: () => void } | null = null; // Restore
    let resizeObserver: ResizeObserver | null = null;
    // REMOVED setTimeout ID again

    try {
      console.log("MonacoCore: Before editor creation");
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
      console.log("MonacoCore: monaco.editor.create completed.");

      (window as any).monacoEditor = editorInstance;
      editorRef.current = editorInstance;
      console.log("MonacoCore: After editor creation (refs assigned)");

      // Restore Vim initialization
      console.log("MonacoCore: Before initVimMode");
      if (statusBarRef.current) { // Restore check
        try {
          vimMode = initVimMode(editorInstance, statusBarRef.current);
          console.log("MonacoCore: initVimMode completed successfully.");
        } catch (vimError) {
           console.error("MonacoCore: Error during initVimMode:", vimError);
        }
      } else {
        console.warn("MonacoCore: statusBarRef not available, skipping initVimMode.");
      }

      // --- REVERTED: Define Vim commands immediately ---
      console.log("MonacoCore: Defining Vim commands immediately after initVimMode.");
      defineVimCommands(editorRef, window as WindowWithVim, toggleVideo);
      // --- END REVERTED ---

      console.log("MonacoCore: After initVimMode and defineVimCommands");
      editorInstance.focus();
      console.log("MonacoCore: editorInstance.focus() called.");


      // Handle window resize using ResizeObserver
      resizeObserver = new ResizeObserver(() => {
        // automaticLayout should handle this
      });
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
        console.log("MonacoCore: ResizeObserver observing containerRef.");
      }

    } catch (error) {
      console.error('MonacoCore: Editor initialization failed inside try block:', error);
    }

    // Cleanup function
    return () => {
      console.log("MonacoCore: Cleanup effect running");
      // REMOVED Timeout clearing logic
      if (resizeObserver && containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver?.disconnect();
      console.log("MonacoCore: ResizeObserver disconnected");

      vimMode?.dispose(); // Restore dispose
      console.log("MonacoCore: Vim mode disposed"); // Restore log

      if (editorInstance) {
          editorInstance.dispose();
          console.log("MonacoCore: Editor instance disposed");
      }

      editorRef.current = null;
      (window as any).monacoEditor = undefined;
      console.log("MonacoCore: Refs and window properties cleared");
    };
  }, [language, toggleVideo]); // Removed 'value' from dependencies

  // Type guard for ITextModel
  function isTextModel(model: monaco.editor.ITextModel | null): model is monaco.editor.ITextModel {
    return model !== null && typeof model.getValue === 'function';
  }

  // Value synchronization (separate effect)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const model = editor.getModel();
    if (isTextModel(model) && model.getValue() !== value) {
      console.log("MonacoCore: Updating editor value.");
      editor.setValue(value);
    }
  }, [value]); // Only depend on 'value'

  return (
    <div data-testid="monaco-editor-container" className="monaco-editor-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div ref={containerRef} style={containerStyle} />
      {/* Restore status bar */}
      <div ref={statusBarRef} className="vim-status-bar" style={{ height: '20px', flexShrink: 0 }} />
    </div>
  );
}
