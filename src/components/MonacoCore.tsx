
import { useRef, useEffect, useState, useCallback } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
// Import namespace and init function
import { initVimMode } from 'monaco-vim';
import * as monacoVim from 'monaco-vim'; // Import namespace
import type { VimModeInstance } from 'monaco-vim';
import { ActivityType, StorageKeys, type IStandaloneCodeEditor, type ITerminalAdapter } from '@handterm/types';
import type { IDisposable, IWindowWithMonacoEditor } from 'packages/types/src/monaco';
import { navigate, parseLocation } from '../utils/navigationUtils';
import type { JSX } from 'react';
import { createLogger, LogLevel } from '../utils/Logger';
import type { IAuthProps } from '../types/HandTerm';
import { putFile } from '../utils/awsApiClient';
import { setChordGlyphScale } from '../signals/appSignals';
import { Data, Either } from 'effect';
import { VimTutHeader } from './VimTutHeader';
import { VIM_TUTORIAL_STEPS } from '../utils/vimTutorialCurriculum';
import {
  getCurrentVimStep,
  advanceVimTutorial,
  evaluateVimStepConditions,
  vimStepCompletedSignal,
  vimStepMessageSignal,
  lastVimAccomplishmentSignal,
  vimTutorialStepIndexSignal,
  updateCompletedVimTutorials,
} from '../signals/vimTutorialSignals';

const logger = createLogger({
  prefix: 'MonacoCore',
  level: LogLevel.WARN // Changed default from DEBUG to WARN
});

// Typed error for the :w/:wq save path. Surfaced via onSaveResult instead of
// being swallowed in a .catch(logger.error).
export class SaveError extends Data.TaggedError('SaveError')<{ message: string }> {}

// Custom Monaco theme with transparent background for terminal mode
monaco.editor.defineTheme('handterm-transparent', {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#00000000',
    'editor.foreground': '#ffffff',
    'editorCursor.foreground': '#ffffff',
    'editor.lineHighlightBackground': '#00000000',
    'editor.selectionBackground': '#000000',
    'editor.inactiveSelectionBackground': '#00000000',
    'editor.selectionForeground': '#808080',
  }
});

// Define commands checking monacoVim namespace import
export function defineVimCommands(
  editorRef: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>,
  auth?: IAuthProps,
  toggleVideo?: () => boolean,
  onSaveResult?: (result: Either.Either<void, SaveError>) => void,
  onVimTutAdvance?: () => void
): boolean {
  logger.debug("Attempting to define Vim commands...");

  let Vim: typeof monacoVim.VimMode.Vim | null = null;
  try {
    // Access Vim object via the namespace import, checking structure
    Vim = monacoVim.VimMode.Vim;
  } catch (e) {
    logger.error("[defineVimCommands] Error accessing API via monacoVim namespace", e);
  }

  // Route the save result to the caller; never swallow a failure silently.
  const handleSaveResult = (result: Either.Either<void, SaveError>): void => {
    if (onSaveResult) {
      onSaveResult(result);
    } else if (result._tag === 'Left') {
      logger.error(':w/:wq upload failed (no onSaveResult wired):', result.left.message);
    }
  };

  const saveToAWS = async (content: string): Promise<Either.Either<void, SaveError>> => {
    if (!auth) {
      return Either.left(new SaveError({ message: ':w/:wq skipped AWS upload: no auth context' }));
    }
    const filename = parseLocation().contentKey || '_index.md';
    try {
      const response = await putFile(auth, filename, content);
      if (response.status !== 200) {
        const detail = response.error ? `: ${response.error}` : '';
        return Either.left(new SaveError({ message: `Upload failed (status ${response.status})${detail}` }));
      }
      return Either.right(undefined);
    } catch (error) {
      return Either.left(new SaveError({ message: error instanceof Error ? error.message : 'Upload failed' }));
    }
  };

  // Check if the Vim object and defineEx method exist
  if (Vim && typeof Vim.defineEx === 'function') {
    logger.info("Vim API found. Defining commands.");

    const syncConfigIfApplicable = (rawText: string) => {
      const filename = parseLocation().contentKey;
      if (filename === 'config.json' || filename === 'config') {
        try {
          const parsed = JSON.parse(rawText);
          if (parsed && typeof parsed['chord-glyph-size'] === 'number') {
            setChordGlyphScale(parsed['chord-glyph-size']);
          }
          localStorage.setItem('config.json', JSON.stringify(parsed, null, 2));
        } catch {
          // ignore malformed JSON during intermediate edits
        }
      }
    };

    Vim.defineEx('w', '', () => {
      if (editorRef.current) {
        const content = editorRef.current.getValue();
        localStorage.setItem(StorageKeys.editContent, JSON.stringify(content));
        syncConfigIfApplicable(content);
        logger.debug(':w command executed, content saved.');
        void saveToAWS(content).then(handleSaveResult);
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
          syncConfigIfApplicable(content);
          logger.debug(':wq command: content saved.');
          void saveToAWS(content).then(handleSaveResult);
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

    Vim.defineEx('next', 'n', () => {
      logger.debug(':next / :n command triggered.');
      if (onVimTutAdvance) {
        onVimTutAdvance();
      }
    });
    logger.info("Vim commands defined successfully.");
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
  auth?: IAuthProps; // For editor mode to upload saved content
  onSaveResult?: (result: Either.Either<void, SaveError>) => void; // Surfaces :w/:wq save outcomes (typed error channel)
  onTerminalReady?: (adapter: ITerminalAdapter) => void; // For terminal mode
  onEditorReady?: (editor: monaco.editor.IStandaloneCodeEditor) => void; // For editor mode
  onEnter?: (value: string) => void; // For terminal mode to handle Enter key
  onVimModeChange?: (mode: string) => void; // Notifies caller of vim mode changes (terminal)
  vimModeInstanceRef?: React.MutableRefObject<VimModeInstance | null>; // Exposes vim instance to caller
}

export default function MonacoCore({ value, language = 'text', toggleVideo, mode, auth, onSaveResult, onEditorReady, onVimModeChange, vimModeInstanceRef }: MonacoCoreProps): JSX.Element {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const statusBarRef = useRef<HTMLDivElement>(null);
  const [containerStyle] = useState({ flexGrow: 1, height: '100%', minHeight: '300px' });
  const vimModeRef = useRef<IDisposable | null>(null);
  const defineCommandsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentVimModeRef = useRef<string>('insert');
  const editorKeydownRef = useRef<IDisposable | null>(null);

  const isVimTut = mode === 'editor' && parseLocation().contentKey === 'vimtut';
  const [vimCursor, setVimCursor] = useState<{ lineNumber: number; column: number }>({ lineNumber: 1, column: 1 });
  const [vimModeState, setVimModeState] = useState<string>('normal');
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleVimTutAdvanceRef = useRef<() => void>(() => {});
  const handleVimTutAdvance = useCallback(() => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    const nextStep = advanceVimTutorial();
    if (nextStep && editorRef.current) {
      editorRef.current.setValue(nextStep.initialText);
      if (nextStep.initialCursor) {
        editorRef.current.setPosition(nextStep.initialCursor);
        editorRef.current.revealPosition(nextStep.initialCursor);
        setVimCursor(nextStep.initialCursor);
      }
      editorRef.current.focus();
    }
  }, []);
  handleVimTutAdvanceRef.current = handleVimTutAdvance;

  const handleVimTutRestart = useCallback(() => {
    const currentStep = getCurrentVimStep();
    if (currentStep && editorRef.current) {
      editorRef.current.setValue(currentStep.initialText);
      if (currentStep.initialCursor) {
        editorRef.current.setPosition(currentStep.initialCursor);
        editorRef.current.revealPosition(currentStep.initialCursor);
        setVimCursor(currentStep.initialCursor);
      }
      editorRef.current.focus();
    }
  }, []);

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
      theme: mode === 'terminal' ? 'handterm-transparent' : 'vs-dark',
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

    if (mode === 'editor') {
      editorInstance.focus();
    }

    // Cleanup for editor creation
    return () => {
      logger.debug("Editor creation cleanup: Disposing editor instance.");
      editorRef.current?.dispose();
      editorRef.current = null;
      (window as IWindowWithMonacoEditor).monacoEditor = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Editor is created once on mount from initial props; value/language/mode are applied by Effect 2
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
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 0,
          folding: false,
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
          fontFamily: '"Fira Code", Menlo, "DejaVu Sans Mono", "Lucida Console", monospace',
          fontSize: 16,
          lineHeight: 19,
          fontLigatures: true,
          cursorBlinking: 'blink',
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

    // Apply the correct Monaco theme based on mode
    monaco.editor.setTheme(mode === 'terminal' ? 'handterm-transparent' : 'vs-dark');

    // Handle model language for editor mode
    if (mode === 'editor') {
      if (editor.getModel()?.getLanguageId() !== language) {
        monaco.editor.setModelLanguage(editor.getModel()!, language!);
      }
    }

    // Value synchronization for editor mode
    if (mode === 'editor') {
      const model = editor.getModel();
      if (model && model.getValue() !== value) {
        logger.debug("ValueSync effect: Updating editor value.");
        editor.setValue(value);
      }
    }

    return () => {
      if (mode === 'editor') {
        monaco.editor.setTheme('handterm-transparent');
      }
    };

  }, [language, mode, value]); // Dependencies for model/options

  // Effect 3: Vim Mode (runs on editor instance or mode changes)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    logger.debug("Vim effect: Configuring Vim based on mode.");

    // Dispose of previous Vim mode if it exists
    if (vimModeRef.current && typeof vimModeRef.current.dispose === 'function') {
      vimModeRef.current.dispose();
      vimModeRef.current = null;
      if (vimModeInstanceRef) vimModeInstanceRef.current = null;
      logger.debug("Vim effect: Disposed previous Vim mode.");
    }
    if (editorKeydownRef.current) {
      editorKeydownRef.current.dispose();
      editorKeydownRef.current = null;
    }
    // Clear any pending command definition timeouts
    if (defineCommandsTimeoutRef.current) {
      clearTimeout(defineCommandsTimeoutRef.current);
      defineCommandsTimeoutRef.current = null;
      logger.debug("Vim effect: Cleared pending Vim command timeout.");
    }

    if (mode === 'editor' || mode === 'terminal') {
      logger.debug(`Vim effect: Initializing Vim mode for ${mode}.`);
      if (statusBarRef.current) {
        try {
          const vimInstance = initVimMode(editor, statusBarRef.current);
          vimModeRef.current = vimInstance;
          if (vimModeInstanceRef) vimModeInstanceRef.current = vimInstance;
          logger.debug(`Vim effect: initVimMode called successfully.`);

          // Track vim mode internally for alt+s handling
          vimInstance.on('vim-mode-change', (modeInfo: { mode: string; subMode?: string }) => {
            currentVimModeRef.current = modeInfo.mode;
            setVimModeState(modeInfo.mode);
            onVimModeChange?.(modeInfo.mode);
          });

          if (mode === 'editor') {
            // Register alt+s to exit insert mode (same as terminal behavior)
            // and Enter to advance completed vimtut step
            editorKeydownRef.current = editor.onKeyDown((e) => {
              if (isVimTut && vimStepCompletedSignal.value) {
                if (e.browserEvent.key === 'Enter' || e.keyCode === monaco.KeyCode.Enter) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleVimTutAdvanceRef.current();
                  return;
                }
              }

              if (e.browserEvent.key === 's' && e.altKey) {
                e.preventDefault();
                e.stopPropagation();
                if (currentVimModeRef.current !== 'normal' && vimModeRef.current) {
                  try {
                    monacoVim.VimMode.Vim.handleKey(vimModeRef.current as unknown as VimModeInstance, '<Esc>');
                    currentVimModeRef.current = 'normal';
                  } catch (err) {
                    logger.warn('Alt+S: could not trigger vim exit-insert', err);
                  }
                }
              }
            });

            defineCommandsTimeoutRef.current = setTimeout(() => {
              logger.debug("Timeout triggered: Attempting to define Vim commands now.");
              defineVimCommands(editorRef, auth, toggleVideo, onSaveResult, () => {
                handleVimTutAdvanceRef.current();
              });
              defineCommandsTimeoutRef.current = null;
            }, 500);
          } else {
            // Terminal should start in insert mode so the user can type commands
            try {
              monacoVim.VimMode.Vim.handleKey(vimInstance, 'i');
              onVimModeChange?.('insert');
            } catch (e) {
              logger.warn("Vim effect: could not enter initial insert mode for terminal", e);
            }
          }
        } catch (vimError) {
          logger.error("Vim effect: Error during initVimMode:", vimError);
        }
      } else {
        logger.warn("Vim effect: statusBarRef not available, skipping initVimMode.");
      }
    }
  }, [mode, toggleVideo, auth, onVimModeChange, onSaveResult, vimModeInstanceRef]); // Dependencies for Vim mode

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

  // Effect 5: Value Synchronization (editor mode only — terminal manages its own model)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || mode !== 'editor') return;

    // Type guard for ITextModel
    function isTextModel(model: monaco.editor.ITextModel | null): model is monaco.editor.ITextModel {
        return model !== null && typeof model.getValue === 'function';
    }

    const model = editor.getModel();
    if (isTextModel(model) && model.getValue() !== value) {
      logger.debug("ValueSync effect: Updating editor value.");
      editor.setValue(value);
    }
  }, [value, mode]); // Depend on value, editor instance, and mode

  // Effect 6: Vim Tutorial Verification Runner
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !isVimTut) return;

    const step = getCurrentVimStep();
    if (!step) return;

    // Set initial text & cursor for the step if editor is not yet set
    if (editor.getValue() !== step.initialText && !vimStepCompletedSignal.value) {
      editor.setValue(step.initialText);
    }
    if (step.initialCursor) {
      editor.setPosition(step.initialCursor);
      editor.revealPosition(step.initialCursor);
      setVimCursor(step.initialCursor);
    }

    const checkConditions = () => {
      if (vimStepCompletedSignal.value) return;
      const currentPos = editor.getPosition() ?? { lineNumber: 1, column: 1 };
      const currentText = editor.getValue();
      const currentMode = currentVimModeRef.current;

      setVimCursor({ lineNumber: currentPos.lineNumber, column: currentPos.column });

      const passed = evaluateVimStepConditions(
        step,
        { lineNumber: currentPos.lineNumber, column: currentPos.column },
        currentText,
        currentMode
      );

      if (passed) {
        logger.info(`Vim tutorial step ${step.id} completed!`);
        vimStepCompletedSignal.value = true;
        const msg = step.successMessage ?? 'Step completed!';
        vimStepMessageSignal.value = msg;
        updateCompletedVimTutorials(prev => new Set(prev).add(step.id));
        lastVimAccomplishmentSignal.value = {
          stepId: step.id,
          stepTitle: step.title,
          message: msg,
        };

        const totalSteps = VIM_TUTORIAL_STEPS.length;
        const isLastStep = vimTutorialStepIndexSignal.value >= totalSteps - 1;
        if (!isLastStep) {
          if (autoAdvanceTimerRef.current) {
            clearTimeout(autoAdvanceTimerRef.current);
          }
          autoAdvanceTimerRef.current = setTimeout(() => {
            handleVimTutAdvanceRef.current();
            autoAdvanceTimerRef.current = null;
          }, 400);
        }
      }
    };

    checkConditions();

    const cursorSub = editor.onDidChangeCursorPosition((e) => {
      setVimCursor({ lineNumber: e.position.lineNumber, column: e.position.column });
      checkConditions();
    });

    const modelSub = editor.onDidChangeModelContent(() => {
      checkConditions();
    });

    return () => {
      cursorSub.dispose();
      modelSub.dispose();
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
    };
  }, [isVimTut, vimTutorialStepIndexSignal.value, vimModeState]);

  // Capture Enter globally when a vimtut step is completed so keyboard-only users
  // can immediately advance to the next step without reaching for a mouse.
  useEffect(() => {
    if (!isVimTut) return;

    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (vimStepCompletedSignal.value && e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleVimTutAdvanceRef.current();
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown, true);
    };
  }, [isVimTut]);

  return (
    <div data-testid="monaco-editor-container" className="monaco-editor-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: '1 1 auto' }}>
      {isVimTut && (
        <VimTutHeader
          currentCursor={vimCursor}
          currentMode={vimModeState}
          onAdvanceStep={handleVimTutAdvance}
          onRestartStep={handleVimTutRestart}
        />
      )}
      <div ref={containerRef} style={containerStyle} />
      <div ref={statusBarRef} className="vim-status-bar" style={{ height: '20px', flexShrink: 0 }} />
    </div>
  );
}
