// hooks/useTerminal.ts
import React, { useCallback, useEffect, useRef } from 'react';
import { useXTerm } from 'react-xtermjs';
import { FitAddon } from '@xterm/addon-fit';
import { XtermAdapterConfig } from '../components/XtermAdapterConfig';
import { useCommand } from './useCommand';
import { useWPMCalculator } from './useWPMCaculator';
import { addKeystroke, commandLineSignal } from 'src/signals/commandLineSignals';
import { useComputed } from '@preact/signals-react';
import { setCommandLine } from 'src/signals/commandLineSignals';
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
import { ActivityType } from 'src/types/Types';
import { useCharacterHandler } from './useCharacterHandler';
import { parseCommand } from 'src/utils/commandUtils';
import { createLogger } from 'src/utils/Logger';
import { TERMINAL_CONSTANTS } from 'src/constants/terminal';

const logger = createLogger({ prefix: 'useTerminal' });

export const useTerminal = () => {
  const { instance, ref: xtermRef } = useXTerm({ options: XtermAdapterConfig });
  const { handleCommand, commandHistory, commandHistoryIndex, setCommandHistoryIndex } = useCommand();
  const wpmCalculator = useWPMCalculator();
  const commandLine = useComputed(() => commandLineSignal.value);

  const [_commandLineState, _setCommandLineState] = React.useState('');

  const fitAddon = useRef(new FitAddon());
  const { PROMPT, PROMPT_LENGTH } = TERMINAL_CONSTANTS;

  const writeToTerminal = useCallback((data: string) => {
    logger.debug('Writing to terminal:', data);
    instance?.write(data);
  }, [instance]);

  const resetPrompt = useCallback(() => {
    if (!instance) return;
    logger.debug('Resetting prompt');
    instance.reset();
    setCommandLine('');
    _setCommandLineState('');
    instance.write(PROMPT);
    instance.scrollToBottom();
  }, [instance]);

  const lastTypedCharacterRef = useRef<string | null>(null);
  const setLastTypedCharacter = (value: string | null) => {
    lastTypedCharacterRef.current = value;
  };

  const {
    handleCharacter,
  } = useCharacterHandler({
    _setCommandLine: _setCommandLineState,
    setLastTypedCharacter,
    isInSvgMode: false,
    isInLoginProcess: isInLoginProcessSignal.value,
    writeOutputInternal: writeToTerminal,
  });

  const getCurrentCommand = useCallback(() => {
    if (!instance) return '';
    const buffer = instance.buffer.active;
    let command = '';
    for (let i = 0; i <= buffer.cursorY; i++) {
      const line = buffer.getLine(i);
      if (line) {
        command += line.translateToString(true);
      }
    }
    const promptEndIndex = command.indexOf(PROMPT) + PROMPT_LENGTH;
    const currentCommand = command.substring(promptEndIndex).trimStart();
    logger.debug('Getting current command:', currentCommand);
    return currentCommand;
  }, [instance]);

  const clearCurrentLine = useCallback(() => {
    if (!instance) return;
    logger.debug('Clearing current line');
    instance.write('\x1b[2K\r'); // Clear the current line
    instance.write(PROMPT); // Rewrite prompt
  }, [instance]);

  const navigateHistory = useCallback((direction: 'up' | 'down') => {
    if (!instance || !commandHistory.length) return;

    let newIndex = commandHistoryIndex;

    if (direction === 'up') {
      if (newIndex === -1) {
        const currentCommand = getCurrentCommand();
        if (currentCommand) {
          setCommandLine(currentCommand);
          _setCommandLineState(currentCommand);
        }
      }
      newIndex = newIndex === -1 ? commandHistory.length - 1 : Math.max(0, newIndex - 1);
    } else {
      newIndex = newIndex === -1 ? -1 : Math.min(commandHistory.length - 1, newIndex + 1);
      if (newIndex === -1) {
        clearCurrentLine();
        const savedCommand = commandLine.value;
        if (savedCommand) {
          instance.write(savedCommand);
          setCommandLine(savedCommand);
          _setCommandLineState(savedCommand);
        }
        setCommandHistoryIndex(newIndex);
        return;
      }
    }

    clearCurrentLine();
    const historicalCommand = commandHistory[newIndex] || '';
    instance.write(historicalCommand);
    setCommandLine(historicalCommand);
    _setCommandLineState(historicalCommand);
    setCommandHistoryIndex(newIndex);
  }, [
    instance,
    commandHistory,
    commandHistoryIndex,
    getCurrentCommand,
    clearCurrentLine,
    setCommandHistoryIndex,
    commandLine,
    _setCommandLineState
  ]);

  useEffect(() => {
    if (!instance) return;
    instance.loadAddon(fitAddon.current);
    fitAddon.current.fit();
    resetPrompt();
  }, [instance, resetPrompt]);

  useEffect(() => {
    if (!instance) return;

    const handleControlCharacters = (data: string, cursorX: number) => {
      logger.debug('Handling control character:', { data, cursorX });
      switch (data) {
        case '\x03': // Ctrl+C
          setCommandLine('');
          _setCommandLineState('');
          setActivity(ActivityType.NORMAL);
          instance?.write('^C');
          resetPrompt();
          return true;

        case '\r': // Enter key
          handleEnterKey();
          return true;

        case '\x7F': // Backspace
          handleBackspace(cursorX);
          return true;

        case '\x1b[D': // Left arrow
          if (cursorX > PROMPT_LENGTH) {
            instance?.write(data);
          }
          return true;

        case '\x1b[A': // Up arrow
          navigateHistory('up');
          return true;

        case '\x1b[B': // Down arrow
          navigateHistory('down');
          return true;

        default:
          return false;
      }
    };

    const handleEnterKey = () => {
      logger.debug('Handling Enter key');
      if (isInLoginProcessSignal.value) {
        const loginCommand = parseCommand([
          'login',
          tempUserNameSignal.value,
          tempPasswordSignal.value
        ].join(' '));
        handleCommand(loginCommand);
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
        handleCommand(signupCommand);
        setIsInSignUpProcess(false);
        setTempPassword('');
        setTempUserName('');
        setTempEmail('');
      } else {
        const currentCommand = getCurrentCommand();
        logger.debug('Processing command:', currentCommand);
        const parsedCommand = parseCommand(currentCommand === '' ? '\r' : currentCommand);
        logger.debug('Parsed command:', parsedCommand);
        instance?.write('\r\n');
        setCommandLine('');
        _setCommandLineState('');
        handleCommand(parsedCommand);
        wpmCalculator.clearKeystrokes();
      }
      setCommandHistoryIndex(-1); // Reset history index after command execution
      resetPrompt();
    };

    const handleBackspace = (cursorX: number) => {
      logger.debug('Handling backspace:', { cursorX });
      if (isInLoginProcessSignal.value || isInSignUpProcessSignal.value) {
        if (tempPasswordSignal.value.length > 0) {
          tempPasswordSignal.value = tempPasswordSignal.value.slice(0, -1);
          instance?.write('\b \b');
        }
      } else if (cursorX > PROMPT_LENGTH) {
        instance?.write('\b \b');
        const newCommandLine = _commandLineState.slice(0, -1);
        setCommandLine(newCommandLine);
        _setCommandLineState(newCommandLine);
      }
    };

    const handleData = (data: string) => {
      if (!instance) return;
      logger.debug('Handling terminal data:', data);
      const cursorX = instance.buffer.active.cursorX;

      if (handleControlCharacters(data, cursorX)) {
        return;
      }

      // Handle regular character input
      if (isInLoginProcessSignal.value || isInSignUpProcessSignal.value) {
        tempPasswordSignal.value += data;
        handleCharacter(data); // This will handle masking
      } else {
        const newCommandLine = _commandLineState + data;
        instance.write(data);
        setCommandLine(newCommandLine);
        _setCommandLineState(newCommandLine);
        addKeystroke(data);
      }
    };

    const resizeHandler = () => {
      fitAddon.current.fit();
      instance.scrollToBottom();
    };
    window.addEventListener('resize', resizeHandler);

    const dataHandler = instance.onData(handleData);

    return () => {
      window.removeEventListener('resize', resizeHandler);
      dataHandler.dispose();
    };
  }, [
    instance,
    getCurrentCommand,
    resetPrompt,
    wpmCalculator,
    commandLine,
    navigateHistory,
    handleCharacter,
    _commandLineState,
    handleCommand,
    setCommandHistoryIndex
  ]);

  return {
    xtermRef,
    writeToTerminal,
    resetPrompt,
  };
};
