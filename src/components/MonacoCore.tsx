import { useRef, useEffect, useState } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { initVimMode } from 'monaco-vim';
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
    if (window.MonacoVim && window.MonacoVim.VimMode && window.MonacoVim.VimMode.Vim) {
        const Vim = window.MonacoVim.VimMode.Vim;

        Vim.defineEx('w', '', () => {
        if (editorRef.current) {
            const content = editorRef.current.getValue();
            localStorage.setItem(StorageKeys.editContent, JSON.stringify(content));
        }
        });

        Vim.defineEx('q', '', () => {
        navigate({ activityKey: ActivityType.NORMAL });
        localStorage.removeItem(StorageKeys.editContent);
        });

        Vim.defineEx('q!', '', () => {
        navigate({ activityKey: ActivityType.NORMAL });
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
    } else {
        console.error('MonacoVim not initialized properly.');
    }
}

export default function MonacoCore({ value, language = 'text', toggleVideo }: MonacoCoreProps): JSX.Element {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const statusBarRef = useRef<HTMLDivElement>(null);
  // Start with auto height to avoid initial large size causing layout shifts
  const [containerStyle, setContainerStyle] = useState({ flexGrow: 1, height: 'auto' });

  // Editor initialization and cleanup
  useEffect(() => {
    if (!containerRef.current || !statusBarRef.current) {
        console.warn("MonacoCore: Container or status bar ref not available yet.");
        return;
    }

    let editorInstance: monaco.editor.IStandaloneCodeEditor | null = null;
    let vimMode: { dispose: () => void } | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let vimDefineTimeoutId: NodeJS.Timeout | null = null; // Store timeout ID

    try {
      console.log("MonacoCore: Before editor creation");
      editorInstance = monaco.editor.create(containerRef.current, {
        value,
        language,
        minimap: { enabled: false },
        automaticLayout: true, // Should handle layout changes
        scrollBeyondLastLine: false,
        readOnly: false,
        theme: 'vs-dark',
        scrollbar: {
          horizontal: 'hidden',
          vertical: 'hidden'
        },
        lineNumbersMinChars: 2,
      });
      // Use type assertion for window assignment if WindowExtensions isn't automatically applied globally
      (window as any).monacoEditor = editorInstance;
      editorRef.current = editorInstance; // Assign to ref
      console.log("MonacoCore: After editor creation");

      // Initialize Vim mode
      console.log("MonacoCore: Before initVimMode");
      vimMode = initVimMode(editorInstance, statusBarRef.current);
      console.log("MonacoCore: After initVimMode");
      editorInstance.focus(); // Focus after Vim mode init

      // Define Vim commands after a short delay
      vimDefineTimeoutId = setTimeout(() => {
          console.log("MonacoCore: Defining Vim commands");
          // Use type assertion for window here as well
          defineVimCommands(editorRef, window as WindowWithVim, toggleVideo);
          vimDefineTimeoutId = null; // Clear timeout ID after execution
      }, 100); // Reduced delay

      // Handle window resize using ResizeObserver
      resizeObserver = new ResizeObserver(() => {
        // automaticLayout should handle this
      });
      if (containerRef.current) { // Check if ref is still valid
        resizeObserver.observe(containerRef.current);
      }

    } catch (error) {
      console.error('MonacoCore: Editor initialization failed:', error);
    }

    // Cleanup function
    return () => {
      console.log("MonacoCore: Cleanup effect running");
      if (vimDefineTimeoutId) {
        clearTimeout(vimDefineTimeoutId);
        console.log("MonacoCore: Cleared Vim define timeout");
      }
      if (resizeObserver && containerRef.current) { // Check ref before unobserving
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver?.disconnect(); // Disconnect observer
      console.log("MonacoCore: ResizeObserver disconnected");

      vimMode?.dispose();
      console.log("MonacoCore: Vim mode disposed");

      // Check editorInstance before disposing
      if (editorInstance) {
          editorInstance.dispose();
          console.log("MonacoCore: Editor instance disposed");
      }

      editorRef.current = null;
      // Use type assertion for window assignment
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
      <div ref={statusBarRef} className="vim-status-bar" style={{ height: '20px', flexShrink: 0 }} />
    </div>
  );
}
