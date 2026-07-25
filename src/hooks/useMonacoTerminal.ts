import { useEffect, useState, useCallback, useMemo, useRef, type MutableRefObject } from 'react';
import { ActivityType, type ITerminalAdapter, type IStandaloneCodeEditor } from '@handterm/types';
import type { IDisposable } from 'monaco-editor/esm/vs/editor/editor.api';
import type { VimModeInstance } from 'monaco-vim';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import * as monacoVim from 'monaco-vim';
import { TERMINAL_CONSTANTS } from 'src/constants/terminal';
import {
  isInLoginProcessSignal,
  isInSignUpProcessSignal,
  setActivity,
  setIsInLoginProcess,
  setIsInSignUpProcess,
  setTempEmail,
  setTempPassword,
  setTempUserName,
  tempEmailSignal,
  tempPasswordSignal,
  tempUserNameSignal
} from 'src/signals/appSignals';
import { addKeystroke, commandLineSignal, setCommandLine } from 'src/signals/commandLineSignals';
import { parseCommand } from 'src/utils/commandUtils';
import { createLogger, LogLevel } from 'src/utils/Logger';
import { useCharacterHandler } from './useCharacterHandler';
import { useCommand } from './useCommand';
import { useWPMCalculator } from './useWPMCaculator';

// ── Configurable vim keybinding ──────────────────────────────────────────────
// Which key combination exits vim insert mode (like NVim's `:imap`).
// Set to 'Escape' for traditional vim, or 'Alt+s' to avoid Monaco stealing focus.
// To change: update this constant, or lift to a localStorage/signal-based setting.
const VIM_ESCAPE_KEY_COMBO = 'Alt+s';
// ─────────────────────────────────────────────────────────────────────────────

export const useMonacoTerminal = (
  editor: IStandaloneCodeEditor | null,
  currentModeRef?: MutableRefObject<string>,
  vimInstanceRef?: MutableRefObject<VimModeInstance | null>
): ITerminalAdapter => {
  const [model, setModel] = useState<monaco.editor.ITextModel | null>(null);
  const [onDataCallbacks, setOnDataCallbacks] = useState<((data: string) => void)[]>([]);
  const logger = createLogger({ prefix: 'useMonacoTerminal', level: LogLevel.WARN });
  const { handleCommand, commandHistory, commandHistoryIndex, setCommandHistoryIndex } = useCommand();
  const wpmCalculator = useWPMCalculator();
  const [_commandLineState, _setCommandLineState] = useState('');
  const lastTypedCharacterRef = useRef<string | null>(null);

  // Use refs for stable adapter methods and internal values
  const editorRef = useRef<IStandaloneCodeEditor | null>(editor);
  const modelRef = useRef<monaco.editor.ITextModel | null>(model);
  const commandHistoryRef = useRef(commandHistory);
  const commandHistoryIndexRef = useRef(commandHistoryIndex);
  const commandLineStateRef = useRef(_commandLineState);

  useEffect(() => { editorRef.current = editor; }, [editor]);
  useEffect(() => { modelRef.current = model; }, [model]);
  useEffect(() => { commandHistoryRef.current = commandHistory; }, [commandHistory]);
  useEffect(() => { commandHistoryIndexRef.current = commandHistoryIndex; }, [commandHistoryIndex]);
  useEffect(() => { commandLineStateRef.current = _commandLineState; }, [_commandLineState]);

  const setLastTypedCharacter = useCallback((value: string | null) => {
    lastTypedCharacterRef.current = value;
  }, []);

  const setValueAndFocusEnd = useCallback((value: string) => {
    const m = modelRef.current;
    const e = editorRef.current;
    if (!m || !e) return;
    m.setValue(value);
    const lastLine = m.getLineCount();
    e.setPosition({ lineNumber: lastLine, column: m.getLineMaxColumn(lastLine) });
    e.revealLine(lastLine);
  }, []);

  const writeOutputInternal = useCallback((data: string) => {
    const m = modelRef.current;
    if (!m) return;
    setValueAndFocusEnd(m.getValue() + data);
  }, [setValueAndFocusEnd]);

  const { handleCharacter } = useCharacterHandler({
    setLastTypedCharacter,
    isInSvgMode: false,
    writeOutputInternal,
  });

  const write = useCallback((data: string) => {
    writeOutputInternal(data);
  }, [writeOutputInternal]);

  const getCurrentCommand = useCallback((): string => {
    return commandLineSignal.value;
  }, []);

  const resetPrompt = useCallback((): void => {
    const e = editorRef.current;
    const m = modelRef.current;
    if (e == null) return;

    if (m) {
      setValueAndFocusEnd(TERMINAL_CONSTANTS.PROMPT);
    }
    setCommandLine('');
    _setCommandLineState('');
  }, [setCommandLine, setValueAndFocusEnd]);

  const navigateHistory = useCallback((direction: 'up' | 'down'): void => {
    const e = editorRef.current;
    const m = modelRef.current;
    const history = commandHistoryRef.current;
    const index = commandHistoryIndexRef.current;

    if (e == null || m == null || history.length === 0) return;

    let newIndex = index;

    if (direction === 'up') {
      newIndex = newIndex === -1 ? history.length - 1 : Math.max(0, newIndex - 1);
    } else { // direction === 'down'
      newIndex = newIndex === -1 ? -1 : Math.min(history.length - 1, newIndex + 1);
      if (newIndex === -1) {
        resetPrompt();
        setCommandHistoryIndex(newIndex);
        return;
      }
    }

    resetPrompt();
    const historicalCommand = history[newIndex] ?? '';
    setValueAndFocusEnd(m.getValue() + historicalCommand);
    setCommandLine(historicalCommand);
    _setCommandLineState(historicalCommand);
    setCommandHistoryIndex(newIndex);
  }, [resetPrompt, setCommandHistoryIndex, setCommandLine, setValueAndFocusEnd, _setCommandLineState]);

  const handleEnterKey = useCallback(() => {
    const e = editorRef.current;
    const m = modelRef.current;
    if (e == null || m == null) return;

    const currentLine = m.getLineCount();
    const currentCommand = m.getLineContent(currentLine).replace(TERMINAL_CONSTANTS.PROMPT, '');
    
    // Process the command
    if (isInLoginProcessSignal.value) {
      const loginCommand = parseCommand([
        'login',
        tempUserNameSignal.value,
        tempPasswordSignal.value
      ].join(' '));
      handleCommand(loginCommand).catch(console.error);
      setIsInLoginProcess(false);
      setTempPassword('');
      setTempUserName('');
    } else if (isInSignUpProcessSignal.value) {
      const signupCommand = parseCommand([
        'signup',
        tempUserNameSignal.value,
        tempEmailSignal.value,
        tempPasswordSignal.value
      ].join(' '));
      handleCommand(signupCommand).catch(console.error);
      setIsInSignUpProcess(false);
      setTempPassword('');
      setTempUserName('');
      setTempEmail('');
    } else {
      const parsedCommand = parseCommand(currentCommand === '' ? '\r' : currentCommand);
      setCommandLine('');
      _setCommandLineState('');
      handleCommand(parsedCommand).catch(console.error);
      wpmCalculator.clearKeystrokes();
    }
    
    setCommandHistoryIndex(-1);
    
    // Write newline and then reset prompt
    const content = m.getValue();
    setValueAndFocusEnd(content + '\n');
    resetPrompt();
  }, [handleCommand, wpmCalculator, setCommandHistoryIndex, resetPrompt, setCommandLine, setValueAndFocusEnd]);

  const handleBackspace = useCallback(() => {
    const m = modelRef.current;
    if (m == null) return;

    const currentLineContent = m.getLineContent(m.getLineCount());
    if (isInLoginProcessSignal.value || isInSignUpProcessSignal.value) {
      if (tempPasswordSignal.value.length > 0) {
        tempPasswordSignal.value = tempPasswordSignal.value.slice(0, -1);
        setValueAndFocusEnd(m.getValue().slice(0, -1));
      }
    } else if (currentLineContent.length > TERMINAL_CONSTANTS.PROMPT_LENGTH) {
      setValueAndFocusEnd(m.getValue().slice(0, -1));
      const newCommandLine = commandLineStateRef.current.slice(0, -1);
      setCommandLine(newCommandLine);
      _setCommandLineState(newCommandLine);
    }
  }, [setCommandLine, setValueAndFocusEnd]);

  const handleData = useCallback((data: string) => {
    const e = editorRef.current;
    const m = modelRef.current;
    if (e == null || m == null) return;

    // Handle control characters
    switch (data) {
      case '\x03': // Ctrl+C
        setCommandLine('');
        _setCommandLineState('');
        setActivity(ActivityType.NORMAL);
        setValueAndFocusEnd(m.getValue() + '^C\r\n');
        resetPrompt();
        return;

      case '\r': // Enter key
        handleEnterKey();
        return;

      case '\x7F': // Backspace
        handleBackspace();
        return;

      case '\x1b[A': // Up arrow
        navigateHistory('up');
        return;

      case '\x1b[B': // Down arrow
        navigateHistory('down');
        return;

      default:
        // Regular character input
        if (isInLoginProcessSignal.value || isInSignUpProcessSignal.value) {
          tempPasswordSignal.value += data;
          handleCharacter(data);
          setValueAndFocusEnd(m.getValue() + data);
        } else {
          const newCommandLine = commandLineStateRef.current + data;
          setValueAndFocusEnd(m.getValue() + data);
          setCommandLine(newCommandLine);
          _setCommandLineState(newCommandLine);
          addKeystroke(data);
        }
        return;
    }
  }, [handleCharacter, handleEnterKey, handleBackspace, resetPrompt, navigateHistory, setCommandLine, setValueAndFocusEnd]);

  // Use a ref for handleData to keep the keydown listener stable
  const handleDataRef = useRef(handleData);
  useEffect(() => {
    handleDataRef.current = handleData;
  }, [handleData]);

  useEffect(() => {
    if (editor) {
      let currentModel = editor.getModel();
      if (!currentModel || currentModel.getLanguageId() !== 'plaintext') {
          currentModel = monaco.editor.createModel(TERMINAL_CONSTANTS.PROMPT, 'plaintext');
          editor.setModel(currentModel);
      } else if (currentModel.getValue() === '') {
          // Editor was created with empty value — set the prompt
          currentModel.setValue(TERMINAL_CONSTANTS.PROMPT);
      }
      setModel(currentModel);

      // Listen to key down events to handle terminal input
      const disposable = editor.onKeyDown((e) => {
        // In vim NORMAL mode, defer entirely to vim so navigation/edit commands
        // (i/a/o to re-enter insert, w/b/dw/cw motions, etc.) work unhindered.
        if (currentModeRef?.current === 'normal') {
          return;
        }

        // Handle Shift+Enter → insert newline
        if (e.keyCode === monaco.KeyCode.Enter && e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          handleDataRef.current('\n');
          return;
        }

        // Handle Enter → submit command
        if (e.keyCode === monaco.KeyCode.Enter) {
          e.preventDefault();
          e.stopPropagation();
          handleDataRef.current('\r');
          return;
        }

        // Handle Backspace
        if (e.keyCode === monaco.KeyCode.Backspace) {
          e.preventDefault();
          e.stopPropagation();
          handleDataRef.current('\x7F');
          return;
        }

        // Handle Ctrl+C
        if (e.keyCode === monaco.KeyCode.KeyC && e.ctrlKey) {
          e.preventDefault();
          e.stopPropagation();
          handleDataRef.current('\x03');
          return;
        }

        // Handle configurable insert-mode exit key (Alt+S by default, like NVim's imap)
        if (VIM_ESCAPE_KEY_COMBO === 'Alt+s' && e.browserEvent.key === 's' && e.altKey) {
          if (currentModeRef?.current !== 'normal' && vimInstanceRef?.current) {
            e.preventDefault();
            e.stopPropagation();
            try {
              monacoVim.VimMode.Vim.handleKey(vimInstanceRef.current, '<Esc>');
            } catch (err) {
              logger.warn('Alt+S: could not trigger vim exit-insert', err);
            }
          } else {
            // Already in normal mode — just consume the event
            e.preventDefault();
            e.stopPropagation();
          }
          return;
        }

        // Handle Arrow Keys
        if (e.keyCode === monaco.KeyCode.UpArrow) {
          e.preventDefault();
          e.stopPropagation();
          handleDataRef.current('\x1b[A');
          return;
        }
        if (e.keyCode === monaco.KeyCode.DownArrow) {
          e.preventDefault();
          e.stopPropagation();
          handleDataRef.current('\x1b[B');
          return;
        }

        // For regular characters, we intercept and handle it ourselves to avoid model loops
        if (e.browserEvent.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          e.stopPropagation();
          handleDataRef.current(e.browserEvent.key);
        }
      });
      
      return () => {
        disposable.dispose();
      };
    }
    return () => {};
  }, [editor]); // Stable: only depends on editor

  const clear = useCallback(() => {
    const m = modelRef.current;
    if (m) setValueAndFocusEnd('');
  }, [setValueAndFocusEnd]);

  const focus = useCallback(() => {
    editorRef.current?.focus();
  }, []);

  const onData = useCallback((callback: (data: string) => void): IDisposable => {
    setOnDataCallbacks(prev => [...prev, callback]);
    return {
      dispose: () => {
        setOnDataCallbacks(prev => prev.filter(cb => cb !== callback));
      },
    };
  }, []);

  const onResize = useCallback(() => null, []);

  const fit = useCallback(() => {
    editorRef.current?.layout();
  }, []);

  const proposeGeometry = useCallback(() => {
    const e = editorRef.current;
    if (e) {
      const container = e.getContainerDomNode();
      if (container) {
        const fontInfo = e.getOption(monaco.editor.EditorOption.fontInfo);
        const rows = Math.floor(container.clientHeight / fontInfo.lineHeight);
        const cols = Math.floor(container.clientWidth / fontInfo.typicalHalfwidthCharacterWidth);
        return { cols, rows };
      }
    }
    return null;
  }, []);

  return useMemo(() => ({
    write,
    clear,
    focus,
    onData,
    fit,
    onResize,
    proposeGeometry,
    resetPrompt,
  }), [write, clear, focus, onData, onResize, fit, proposeGeometry, resetPrompt]);
};
