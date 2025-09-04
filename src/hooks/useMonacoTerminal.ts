import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { ActivityType, type ITerminalAdapter, type IStandaloneCodeEditor } from '@handterm/types';
import type { IDisposable } from 'monaco-editor/esm/vs/editor/editor.api';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
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
import { useComputed } from '@preact/signals-react';

export const useMonacoTerminal = (editor: IStandaloneCodeEditor | null): ITerminalAdapter => {
  const [model, setModel] = useState<monaco.editor.ITextModel | null>(null);
  const [onDataCallbacks, setOnDataCallbacks] = useState<((data: string) => void)[]>([]);
  const logger = createLogger({ prefix: 'useMonacoTerminal', level: LogLevel.WARN });
  const { handleCommand, commandHistory, commandHistoryIndex, setCommandHistoryIndex } = useCommand();
  const wpmCalculator = useWPMCalculator();
  const commandLine = useComputed(() => commandLineSignal.value);
  const [_commandLineState, _setCommandLineState] = useState('');
  const lastTypedCharacterRef = useRef<string | null>(null);
  const setLastTypedCharacter = (value: string | null) => {
    lastTypedCharacterRef.current = value;
  };
  const { handleCharacter } = useCharacterHandler({
    setLastTypedCharacter,
    isInSvgMode: false,
    writeOutputInternal: (data: string) => {
      if (model && editor) {
        const currentContent = model.getValue();
        model.setValue(currentContent + data);
        editor.revealLine(model.getLineCount());
      }
    },
  });

  const write = useCallback((data: string) => {
    if (model && editor) {
      const currentContent = model.getValue();
      model.setValue(currentContent + data);
      editor.revealLine(model.getLineCount());
    }
  }, [model, editor]);

  const getCurrentCommand = useCallback((): string => {
    return commandLine.value;
  }, [commandLine]);

  const resetPrompt = useCallback((): void => {
    logger.debug('resetPrompt called.');
    if (editor == null) {
      logger.warn('resetPrompt: editor is null, returning.');
      return;
    }

    logger.debug('resetPrompt: Clearing terminal content.');
    if (model) {
      model.setValue('');
    }
    logger.debug('resetPrompt: Resetting command line signals.');
    setCommandLine('');
    _setCommandLineState('');
    logger.debug('resetPrompt: Writing prompt to terminal.');
    if (model) {
      model.setValue(TERMINAL_CONSTANTS.PROMPT);
      editor.revealLine(model.getLineCount());
    }
    logger.debug('resetPrompt: Completed.');
  }, [editor, model, setCommandLine, _setCommandLineState, logger]);

  const navigateHistory = useCallback((direction: 'up' | 'down'): void => {
    if (editor == null || model == null || (commandHistory.length === 0)) return;

    let newIndex = commandHistoryIndex;

    if (direction === 'up') {
      newIndex = newIndex === -1 ? commandHistory.length - 1 : Math.max(0, newIndex - 1);
    } else { // direction === 'down'
      newIndex = newIndex === -1 ? -1 : Math.min(commandHistory.length - 1, newIndex + 1);
      if (newIndex === -1) {
        resetPrompt();
        setCommandHistoryIndex(newIndex);
        return;
      }
    }

    resetPrompt();
    const historicalCommand = commandHistory[newIndex] ?? '';
    model.setValue(model.getValue() + historicalCommand);
    editor.revealLine(model.getLineCount());
    setCommandLine(historicalCommand);
    _setCommandLineState(historicalCommand);
    setCommandHistoryIndex(newIndex);
  }, [editor, model, commandHistory, commandHistoryIndex, resetPrompt, setCommandHistoryIndex, setCommandLine, _setCommandLineState]);

  const handleEnterKey = useCallback(() => {
    if (editor == null || model == null) return;

    const currentCommand = model.getLineContent(model.getLineCount());
    editor.setValue(model.getValue() + '\n'); // Add newline for command output

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
      logger.debug('Processing command:', currentCommand);
      const parsedCommand = parseCommand(currentCommand === '' ? '\r' : currentCommand);
      logger.debug('Parsed command:', parsedCommand);
      setCommandLine('');
      _setCommandLineState('');
      handleCommand(parsedCommand).catch(console.error);
      wpmCalculator.clearKeystrokes();
    }
    setCommandHistoryIndex(-1);
    resetPrompt();
  }, [editor, model, isInLoginProcessSignal.value, isInSignUpProcessSignal.value, tempUserNameSignal.value, tempPasswordSignal.value, tempEmailSignal.value, handleCommand, wpmCalculator, setCommandHistoryIndex, resetPrompt, setCommandLine, _setCommandLineState, logger]);

  const handleBackspace = useCallback(() => {
    if (editor == null || model == null) return;

    const currentLineContent = model.getLineContent(model.getLineCount());
    if (isInLoginProcessSignal.value || isInSignUpProcessSignal.value) {
      if (tempPasswordSignal.value.length > 0) {
        tempPasswordSignal.value = tempPasswordSignal.value.slice(0, -1);
        model.setValue(model.getValue().slice(0, -1)); // Remove last char from model
      }
    } else if (currentLineContent.length > TERMINAL_CONSTANTS.PROMPT_LENGTH) {
      model.setValue(model.getValue().slice(0, -1)); // Remove last char from model
      const newCommandLine = _commandLineState.slice(0, -1);
      setCommandLine(newCommandLine);
      _setCommandLineState(newCommandLine);
    }
  }, [editor, model, isInLoginProcessSignal.value, isInSignUpProcessSignal.value, tempPasswordSignal.value, _commandLineState, setCommandLine, _setCommandLineState]);

  const handleData = useCallback((data: string) => {
    if (editor == null || model == null) return;
    logger.debug('Handling terminal data:', data);

    // Handle control characters
    switch (data) {
      case '\x03': // Ctrl+C
        setCommandLine('');
        _setCommandLineState('');
        setActivity(ActivityType.NORMAL);
        if (model) {
          model.setValue(model.getValue() + '^C\r\n');
        }
        resetPrompt();
        return;

      case '\r': // Enter key
        handleEnterKey();
        return;

      case '\x7F': // Backspace
        handleBackspace();
        return;

      case '\x1b[D': // Left arrow
        // Monaco handles cursor movement internally, no need to write data
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
          model.setValue(model.getValue() + data); // Add char to model
        } else {
          const newCommandLine = _commandLineState + data;
          model.setValue(model.getValue() + data); // Add char to model
          setCommandLine(newCommandLine);
          _setCommandLineState(newCommandLine);
          addKeystroke(data);
        }
        return;
    }
  }, [editor, model, isInLoginProcessSignal.value, isInSignUpProcessSignal.value, tempPasswordSignal.value, _commandLineState, setCommandLine, _setCommandLineState, addKeystroke, handleCharacter, handleEnterKey, handleBackspace, resetPrompt, setActivity, navigateHistory, logger]);

  useEffect(() => {
    if (editor) {
      const newModel = monaco.editor.createModel('', 'plaintext');
      editor.setModel(newModel);
      setModel(newModel);

      const disposable = editor.onDidChangeModelContent((event: monaco.editor.IModelContentChangedEvent) => {
        const lastChange = event.changes[event.changes.length - 1];
        if (lastChange && lastChange.text.length > 0) {
          onDataCallbacks.forEach(callback => callback(lastChange.text));
          handleData(lastChange.text); // Explicitly call handleData here
        }
      });

      return () => {
        disposable.dispose();
        newModel.dispose();
      };
    }
    return () => {};
  }, [editor, onDataCallbacks, handleData]); // Add handleData to dependencies

  const clear = useCallback(() => {
    if (model) {
      model.setValue('');
    }
  }, [model]);

  const focus = useCallback(() => {
    editor?.focus();
  }, [editor]);

  const onData = useCallback((callback: (data: string) => void): IDisposable => {
    setOnDataCallbacks(prev => [...prev, callback]);
    return {
      dispose: () => {
        setOnDataCallbacks(prev => prev.filter(cb => cb !== callback));
      },
    };
  }, []);


  const onResize = useCallback(() => {
    console.warn("OnResize not implemented");
    return null;
  }, []);

  const fit = useCallback(() => {
    if (editor) {
      editor.layout();
      // Monaco doesn't have a direct 'fit' method like xterm.js.
      // Layouting should handle most of it.
      // If specific column/row calculation is needed, it would go here.
    }
  }, [editor]);

  const proposeGeometry = useCallback(() => {
    if (editor) {
      const container = editor.getContainerDomNode();
      if (container) {
        const fontInfo = editor.getOption(monaco.editor.EditorOption.fontInfo);
        const lineHeight = fontInfo.lineHeight;
        const charWidth = fontInfo.typicalHalfwidthCharacterWidth;

        const rows = Math.floor(container.clientHeight / lineHeight);
        const cols = Math.floor(container.clientWidth / charWidth);

        return { cols, rows };
      }
    }
    return null;
  }, [editor]);

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