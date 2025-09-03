import { useRef, useEffect, useState } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
// Import namespace and init function
import { initVimMode } from 'monaco-vim';
import * as monacoVim from 'monaco-vim'; // Import namespace
import { ActivityType, StorageKeys, type IStandaloneCodeEditor, type ITerminalAdapter } from '@handterm/types';
import { navigate } from '../utils/navigationUtils';
import type { JSX } from 'react';
import { createLogger, LogLevel } from '../utils/Logger';

const logger = createLogger({
  prefix: 'MonacoCore',
  level: LogLevel.DEBUG
});

// Define commands checking monacoVim namespace import
export function defineVimCommands(
    editorRef: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>,
    toggleVideo?: () => boolean
): boolean {
    logger.debug("Attempting to define Vim commands checking monacoVim namespace...");

    let Vim: typeof monacoVim.VimMode.Vim | null = null;
    try {
        // Access Vim object via the namespace import, checking structure
        Vim = monacoVim.VimMode.Vim;
    } catch (e) {
         logger.error("[defineVimCommands] Error accessing API via monacoVim namespace", e);
    }


    // Check if the Vim object and defineEx method exist
    if (Vim && typeof Vim.defineEx === 'function') {
        logger.info("Vim API found via monacoVim namespace. Defining commands.");

        Vim.defineEx('w', '', () => {
        if (editorRef.current) {
            const content = editorRef.current.getValue();
            localStorage.setItem(StorageKeys.editContent, JSON.stringify(content));
            logger.debug(':w command executed, content saved.');
        }
        });

        // --- Restore :q definition with error handling ---
        Vim.defineEx('q', '', () => {
          logger.debug(':q command triggered. Attempting to navigate...');
          try {
            navigate({ activityKey: ActivityType.NORMAL });
            logger.debug(':q command: navigate called. Removing editContent from localStorage.');
            localStorage.removeItem(StorageKeys.editContent);
          } catch (error) {
            logger.error(':q command: Error during navigation or localStorage removal', { error });
          }
        });
        // --- End Restore :q ---

        // ENHANCED: Add error handling to :q! definition
        Vim.defineEx('q!', '', () => {
          logger.debug(':q! command triggered. Attempting to navigate...');
          try {
            navigate({ activityKey: ActivityType.NORMAL });
            logger.debug(':q! command: navigate called. Removing editContent from localStorage.');
            localStorage.removeItem(StorageKeys.editContent);
          } catch (error) {
            logger.error(':q! command: Error during navigation or localStorage removal', { error });
          }
        });
        // END ENHANCED

        // ENHANCED: Add error handling to :wq definition
        Vim.defineEx('wq', '', () => {
          logger.debug(':wq command triggered. Attempting to save and navigate...');
          try {
            if (editorRef.current) {
                const content = editorRef.current.getValue();
                localStorage.setItem(StorageKeys.editContent, JSON.stringify(content));
                logger.debug(':wq command: content saved.');
            }
            navigate({ activityKey: ActivityType.NORMAL });
            logger.debug(':wq command: navigate called. Removing editContent from localStorage.');
            localStorage.removeItem(StorageKeys.editContent);
          } catch (error) {
            logger.error(':wq command: Error during save, navigation, or localStorage removal', { error });
          }
        });
        // END ENHANCED

        Vim.defineEx('vid', '', () => {
        if (toggleVideo) {
            logger.debug(':vid command triggered.');
            toggleVideo();
        }
        });
        logger.info("Vim commands defined successfully via monacoVim namespace.");
        return true; // Indicate success
    } else {
        logger.error('[defineVimCommands] Vim API not found via monacoVim namespace.');
        return false; // Indicate failure
    }
}

interface MonacoCoreProps {
  value: string;
  language?: string;
  toggleVideo?: () => boolean;
  mode: 'editor' | 'terminal'; // Add this prop
  onTerminalReady?: (adapter: ITerminalAdapter) => void; // For terminal mode
  onEditorReady?: (editor: monaco.editor.IStandaloneCodeEditor) => void; // For editor mode
  onEnter?: (value: string) => void; // For terminal mode to handle Enter key
}

export default function MonacoCore({ value, language = 'text', toggleVideo, mode, onEditorReady, onEnter }: MonacoCoreProps): JSX.Element {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const statusBarRef = useRef<HTMLDivElement>(null);
  const [containerStyle] = useState({ flexGrow: 1, height: '100%', minHeight: '300px' });
  const vimModeRef = useRef<boolean>(null); // Holds return of initVimMode
  const initRan = useRef(false); // StrictMode flag
  const defineCommandsTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref for the timeout

  // Effect 1: Editor/Vim Initialization (runs once due to initRan flag)
  useEffect(() => {
    if (initRan.current) {
        logger.debug("Initialization effect: Skipping second run (StrictMode).");
        return;
    }

    if (!containerRef.current || (mode === 'editor' && !statusBarRef.current)) {
        logger.warn("Initialization effect: Container or status bar ref not available yet.");
        return;
    }
    logger.debug("Initialization effect: Refs available. Proceeding.");

    let editorInstance: monaco.editor.IStandaloneCodeEditor | null = null;
    let resizeObserver: ResizeObserver | null = null;

    try {
      logger.debug("Initialization effect: Before editor creation");

      const getMonacoOptions = (currentMode: 'editor' | 'terminal'): monaco.editor.IEditorOptions => {
        if (currentMode === 'terminal') {
          return {
            readOnly: false, // Allow input
            lineNumbers: 'off',
            wordWrap: 'on',
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            scrollBeyondLastLine: false,
            minimap: { enabled: false },
            scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
            renderLineHighlight: 'none',
            contextmenu: false,
            quickSuggestions: false,
            hover: { enabled: false },
            links: false,
            cursorStyle: 'block',
            fontFamily: 'monospace',
            fontSize: 14,
            automaticLayout: true,
          };
        } else { // 'editor' mode
          return {
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            readOnly: false,
            scrollbar: {
              horizontal: 'hidden',
              vertical: 'hidden'
            },
            lineNumbersMinChars: 2,
          };
        }
      };

      editorInstance = monaco.editor.create(containerRef.current, {
        value,
        language,
        theme: 'vs-dark', // Apply theme here, outside of getMonacoOptions
        ...getMonacoOptions(mode),
      });
      logger.debug("Initialization effect: monaco.editor.create completed.");

      (window as any).monacoEditor = editorInstance;
      editorRef.current = editorInstance; // Set the ref HERE
      logger.debug("Initialization effect: Editor instance assigned to ref.");

      if (onEditorReady) {
        onEditorReady(editorInstance);
      }

      if (mode === 'editor') {
        logger.debug("Initialization effect: Before initVimMode for editor mode");
        if (statusBarRef.current) {
          try {
            vimModeRef.current = initVimMode(editorInstance, statusBarRef.current);
            logger.debug(`Initialization effect: initVimMode called successfully.`);

            // --- Define commands after a longer delay ---
            logger.debug("Setting timeout to define Vim commands shortly...");
            defineCommandsTimeoutRef.current = setTimeout(() => {
                logger.debug("Timeout triggered: Attempting to define Vim commands now.");
                defineVimCommands(editorRef, toggleVideo);
                defineCommandsTimeoutRef.current = null; // Clear ref after execution
            }, 500); // Increased Delay
            // --- End define commands delay ---

          } catch (vimError) {
             logger.error("Initialization effect: Error during initVimMode:", vimError);
          }
        } else {
          logger.warn("Initialization effect: statusBarRef not available, skipping initVimMode.");
        }
      } else if (mode === 'terminal') {
        // For terminal mode, we might want to always be in insert mode or handle keybindings differently
        // For now, we'll just disable vim mode for terminal.
        logger.debug("Terminal mode: Skipping Vim initialization.");

        // Handle Enter key for terminal mode
        editorInstance.addAction({
          id: 'terminal-send-command',
          label: 'Send Terminal Command',
          keybindings: [monaco.KeyCode.Enter],
          precondition: '', // Changed from undefined/null to empty string
          keybindingContext: '', // Changed from undefined/null to empty string
          contextMenuGroupId: 'navigation',
          run: (editor) => {
            if (onEnter) {
              const model = editor.getModel();
              if (model) {
                const lastLine = model.getLineCount();
                const lineContent = model.getLineContent(lastLine);
                onEnter(lineContent);
                editor.setValue(''); // Clear input after sending
              }
            }
          },
        });
      }


      logger.debug("Initialization effect: Sequence complete.");
      editorInstance.focus();
      logger.debug("Initialization effect: editorInstance.focus() called.");

      resizeObserver = new ResizeObserver(() => {});
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
        logger.debug("Initialization effect: ResizeObserver observing containerRef.");
      }

      initRan.current = true; // Mark as run
      logger.debug("Initialization effect: Marked initRan.current = true");

    } catch (error) {
      logger.error('Initialization effect: Failed inside try block:', error);
    }

    // Cleanup function for Initialization effect
    return () => {
      logger.debug("Cleanup effect running for Initialization");

      // Clear the command definition timeout if it's still pending
      if (defineCommandsTimeoutRef.current) {
          logger.debug("Clearing pending defineVimCommands timeout.");
          clearTimeout(defineCommandsTimeoutRef.current);
          defineCommandsTimeoutRef.current = null;
      }

      if (resizeObserver && containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver?.disconnect();
      logger.debug("Initialization cleanup: ResizeObserver disconnected");

      if (vimModeRef.current && typeof vimModeRef.current.dispose === 'function') {
          vimModeRef.current.dispose();
          logger.debug("Initialization cleanup: Vim mode disposed");
      }
      vimModeRef.current = null;

      if (editorRef.current) { // Use ref for disposal check
          editorRef.current.dispose();
          logger.debug("Initialization cleanup: Editor instance disposed");
      }
      editorRef.current = null; // Clear the ref

      (window as any).monacoEditor = undefined;
      logger.debug("Initialization cleanup: Refs and window properties cleared");

      initRan.current = false; // Reset flag on unmount
      logger.debug("Initialization cleanup: Reset initRan.current = false");
    };
  }, [language, mode, onEditorReady, onEnter, toggleVideo]); // Dependency array for initialization

  // Removed polling effect

  // Effect 3: Value Synchronization
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return; // Check if editor exists

    // Type guard for ITextModel
    function isTextModel(model: monaco.editor.ITextModel | null): model is monaco.editor.ITextModel {
        return model !== null && typeof model.getValue === 'function';
    }

    const model = editor.getModel();
    if (isTextModel(model) && model.getValue() !== value) {
      logger.debug("ValueSync effect: Updating editor value.");
      editor.setValue(value);
    }
  }, [value, editorRef.current]); // Depend on value and editor instance

  return (
    <div data-testid="monaco-editor-container" className="monaco-editor-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: '1 1 auto' }}>
      <div ref={containerRef} style={containerStyle} />
      {mode === 'editor' && <div ref={statusBarRef} className="vim-status-bar" style={{ height: '20px', flexShrink: 0 }} />}
    </div>
  );
}
