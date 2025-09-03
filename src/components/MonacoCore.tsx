import { useRef, useEffect, useState } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
// Import namespace and init function
import { initVimMode } from 'monaco-vim';
import * as monacoVim from 'monaco-vim';
import { ActivityType, StorageKeys, type IStandaloneCodeEditor, type ITerminalAdapter, type IDisposable, type IWindowWithMonacoEditor } from '@handterm/types';
import { navigate } from '../utils/navigationUtils';
import type { JSX } from 'react';
import { createLogger, LogLevel } from '../utils/Logger';

const logger = createLogger({
  prefix: 'MonacoCore',
  level: LogLevel.WARN // Changed default from DEBUG to WARN
});

// Define commands checking monacoVim namespace import
export function defineVimCommands(
    editorRef: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>,
    toggleVideo?: () => boolean
): boolean {
    logger.debug("Attempting to define Vim commands...");

    const Vim = monacoVim.VimMode.Vim;


    // Check if the Vim object and defineEx method exist
    if (Vim && typeof Vim.defineEx === 'function') {
        logger.info("Vim API found. Defining commands.");

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
        logger.info("Vim commands defined successfully.");
        return true; // Indicate success
    } else {
        logger.error('[defineVimCommands] Vim API not found.');
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
  const vimModeRef = useRef<IDisposable | null>(null);
  const defineCommandsTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref for the timeout

  // Effect 1: Editor Creation (runs once on mount)
  useEffect(() => {
    if (!containerRef.current) {
      logger.warn("Editor creation effect: Container ref not available yet.");
      return;
    }

    logger.debug("Editor creation effect: Creating editor instance.");
    const editorInstance = monaco.editor.create(containerRef.current, {
      value,
      language,
      theme: 'vs-dark',
      // Initial options, will be updated by another effect
      minimap: { enabled: false },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      readOnly: false,
      scrollbar: {
        horizontal: 'hidden',
        vertical: 'hidden'
      },
      lineNumbersMinChars: 2,
    });

    editorRef.current = editorInstance;
    (window as IWindowWithMonacoEditor).monacoEditor = editorInstance;
    logger.debug("Editor creation effect: Editor instance assigned to ref.");

    if (onEditorReady) {
      onEditorReady(editorInstance);
    }

    // Cleanup for editor creation
    return () => {
      logger.debug("Editor creation cleanup: Disposing editor instance.");
      editorRef.current?.dispose();
      editorRef.current = null;
      (window as IWindowWithMonacoEditor).monacoEditor = undefined;
    };
  }, []); // Empty dependency array: runs once on mount and once on unmount

  // Effect 2: Model and Options Configuration (runs on mode/language/value changes)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    logger.debug("Model/Options effect: Configuring editor based on mode/language/value.");

    const getMonacoOptions = (currentMode: 'editor' | 'terminal'): monaco.editor.IEditorOptions => {
      if (currentMode === 'terminal') {
        return {
          readOnly: false,
          lineNumbers: 'off',
          wordWrap: 'on',
          overviewRulerLanes: 0,
          glyphMargin: false, // Remove gutter
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

    editor.updateOptions(getMonacoOptions(mode));

    // Handle model creation/setting for terminal mode
    if (mode === 'terminal') {
      if (!editor.getModel() || editor.getModel()?.getLanguageId() !== 'plaintext') {
        const newModel = monaco.editor.createModel('', 'plaintext');
        editor.setModel(newModel);
      }
    } else { // editor mode
      // Ensure model language is correct
      if (editor.getModel()?.getLanguageId() !== language) {
        monaco.editor.setModelLanguage(editor.getModel()!, language!);
      }
    }

    // Value synchronization
    const model = editor.getModel();
    if (model && model.getValue() !== value) {
      logger.debug("Model/Options effect: Updating editor value.");
      editor.setValue(value);
    }

  }, [editorRef.current, language, mode, value]); // Dependencies for model/options

  // Effect 3: Vim Mode and Enter Key Handling (runs on editor instance or mode changes)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    logger.debug("Vim/Enter key effect: Configuring keybindings based on mode.");

    // Dispose of previous Vim mode if it exists
    if (vimModeRef.current && typeof vimModeRef.current.dispose === 'function') {
      vimModeRef.current.dispose();
      vimModeRef.current = null;
      logger.debug("Vim/Enter key effect: Disposed previous Vim mode.");
    }
    // Clear any pending command definition timeouts
    if (defineCommandsTimeoutRef.current) {
      clearTimeout(defineCommandsTimeoutRef.current);
      defineCommandsTimeoutRef.current = null;
      logger.debug("Vim/Enter key effect: Cleared pending Vim command timeout.");
    }

    if (mode === 'editor') {
      logger.debug("Vim/Enter key effect: Initializing Vim mode for editor.");
      if (statusBarRef.current) {
        try {
          vimModeRef.current = initVimMode(editor, statusBarRef.current);
          logger.debug(`Vim/Enter key effect: initVimMode called successfully.`);

          defineCommandsTimeoutRef.current = setTimeout(() => {
            logger.debug("Timeout triggered: Attempting to define Vim commands now.");
            defineVimCommands(editorRef, toggleVideo);
            defineCommandsTimeoutRef.current = null;
          }, 500);
        } catch (vimError) {
          logger.error("Vim/Enter key effect: Error during initVimMode:", vimError);
        }
      } else {
        logger.warn("Vim/Enter key effect: statusBarRef not available, skipping initVimMode.");
      }
    } else if (mode === 'terminal') {
      logger.debug("Vim/Enter key effect: Configuring Enter key for terminal mode.");
      // Ensure no duplicate actions if this effect runs multiple times
      editor.addAction({
        id: 'terminal-send-command',
        label: 'Send Terminal Command',
        keybindings: [monaco.KeyCode.Enter],
        precondition: '',
        keybindingContext: '',
        contextMenuGroupId: 'navigation',
        run: (editor) => {
          if (onEnter) {
            const model = editor.getModel();
            if (model) {
              const lastLine = model.getLineCount();
              const lineContent = model.getLineContent(lastLine);
              onEnter(lineContent);
              editor.setValue('');
            }
          }
        },
      });
    }
  }, [editorRef.current, mode, onEnter, toggleVideo]); // Dependencies for Vim/Enter key

  // Effect 4: Resize Observer (runs once on mount)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !containerRef.current) return;

    logger.debug("ResizeObserver effect: Setting up ResizeObserver.");
    const resizeObserver = new ResizeObserver(() => {
      editor.layout();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      logger.debug("ResizeObserver cleanup: Disconnecting ResizeObserver.");
      resizeObserver.disconnect();
    };
  }, []); // Empty dependency array: runs once on mount and once on unmount

  // Removed polling effect

  // Effect 5: Value Synchronization
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
