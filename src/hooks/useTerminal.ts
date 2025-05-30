// hooks/useTerminal.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { useComputed } from '@preact/signals-react';
import { FitAddon } from '@xterm/addon-fit';
import { useXTerm } from 'react-xtermjs';

import { TERMINAL_CONSTANTS } from 'src/constants/terminal';
import { XtermAdapterConfig } from '../components/XtermAdapterConfig';
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
import { ActivityType } from '@handterm/types';
import { parseCommand } from 'src/utils/commandUtils';
import { createLogger } from 'src/utils/Logger';
import { useCharacterHandler } from './useCharacterHandler';
import { useCommand } from './useCommand';
import { useWPMCalculator } from './useWPMCaculator';

const logger = createLogger({ prefix: 'useTerminal' });

export const useTerminal = (): { xtermRef: React.RefObject<HTMLDivElement>; writeToTerminal: (data: string) => void; resetPrompt: () => void } => {
  const { instance, ref: xtermRef } = useXTerm({ options: XtermAdapterConfig });
  const { handleCommand, commandHistory, commandHistoryIndex, setCommandHistoryIndex } = useCommand();
  const wpmCalculator = useWPMCalculator();
  const commandLine = useComputed(() => commandLineSignal.value);
  const [_commandLineState, _setCommandLineState] = useState('');
  const fitAddon = useRef(new FitAddon());

  const writeToTerminal = useCallback((data: string): void => {
    logger.debug('Writing to terminal:', data);
    instance?.write(data);
  }, [instance]);

  const getCurrentCommand = useCallback((): string => {
    return commandLine.value;
  }, [commandLine]);

  // Use instance.reset() as it seems most reliable overall
  const resetPrompt = useCallback((): void => {
    if (instance == null) return;
    logger.debug('Resetting prompt using instance.reset()');

    // Reset terminal state using the instance method
    instance.reset();

    // Reset command line signal state
    setCommandLine('');
    _setCommandLineState('');

    // Write the prompt after resetting
    instance.write(TERMINAL_CONSTANTS.PROMPT);

    instance.scrollToBottom();
  }, [instance]);

  const lastTypedCharacterRef = useRef<string | null>(null);
  const setLastTypedCharacter = (value: string | null) => {
    lastTypedCharacterRef.current = value;
  };

  const {
    handleCharacter,
  } = useCharacterHandler({
    setLastTypedCharacter,
    isInSvgMode: false,
    writeOutputInternal: writeToTerminal,
  });

  // Keep this commented out as resetPrompt should handle clearing
  // const clearCurrentLine = useCallback((): void => {
  //   if (instance == null) return;
  //   logger.debug('Clearing current line');
  //   instance.write('\x1b[2K\r'); // Clear the current line
  //   instance.write(TERMINAL_CONSTANTS.PROMPT); // Rewrite prompt
  // }, [instance]);

  const navigateHistory = useCallback((direction: 'up' | 'down'): void => {
    if (instance == null || (commandHistory.length === 0)) return;

    let newIndex = commandHistoryIndex;

    if (direction === 'up') {
      if (newIndex === -1) {
        // Store current line content temporarily if needed, but don't modify state yet
        // const currentCommand = getCurrentCommand();
      }
      newIndex = newIndex === -1 ? commandHistory.length - 1 : Math.max(0, newIndex - 1);
    } else { // direction === 'down'
      newIndex = newIndex === -1 ? -1 : Math.min(commandHistory.length - 1, newIndex + 1);
      if (newIndex === -1) {
        resetPrompt(); // Clear screen and show prompt
        // Restore saved command logic could go here if needed
        setCommandHistoryIndex(newIndex);
        return;
      }
    }

    // For valid history index, reset prompt and write historical command
    resetPrompt(); // Use resetPrompt to clear screen first
    const historicalCommand = commandHistory[newIndex] ?? '';
    instance.write(historicalCommand); // Write command after prompt
    setCommandLine(historicalCommand);
    _setCommandLineState(historicalCommand);
    setCommandHistoryIndex(newIndex);
  }, [instance, commandHistory, commandHistoryIndex, getCurrentCommand, resetPrompt, setCommandHistoryIndex]); // Use resetPrompt

  useEffect(() => {
    if (instance == null) return;

    // Expose terminal instance for testing
    if (process.env.NODE_ENV !== 'production') {
      (window as any).terminalInstance = instance;
    }

    instance.loadAddon(fitAddon.current);
    fitAddon.current.fit();
    // Write initial prompt on load
    instance.write(TERMINAL_CONSTANTS.PROMPT);
  }, [instance]);

  useEffect(() => {
    if (instance == null) return;

    const handleControlCharacters = (data: string, cursorX: number) => {
      logger.debug('Handling control character:', { data, cursorX });
      switch (data) {
        case '\x03': // Ctrl+C
          setCommandLine('');
          _setCommandLineState('');
          setActivity(ActivityType.NORMAL);
          instance?.write('^C\r\n'); // Add newline after ^C
          resetPrompt(); // Reset prompt after Ctrl+C
          return true;

        case '\r': // Enter key
          handleEnterKey();
          return true;

        case '\x7F': // Backspace
          handleBackspace(cursorX);
          return true;

        case '\x1b[D': // Left arrow
          if (cursorX > TERMINAL_CONSTANTS.PROMPT_LENGTH) {
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
      if (instance == null) return;

      // Write newline before processing command
      instance.write('\r\n');

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
        const currentCommand = getCurrentCommand();
        logger.debug('Processing command:', currentCommand);
        const parsedCommand = parseCommand(currentCommand === '' ? '\r' : currentCommand);
        logger.debug('Parsed command:', parsedCommand);
        // instance?.write('\r\n'); // Moved newline write earlier
        setCommandLine('');
        _setCommandLineState('');
        handleCommand(parsedCommand).catch(console.error);
        wpmCalculator.clearKeystrokes();
      }
      setCommandHistoryIndex(-1); // Reset history index after command execution
      resetPrompt(); // Reset prompt after command execution
    };

    const handleBackspace = (cursorX: number) => {
      logger.debug('Handling backspace:', { cursorX });
      if (isInLoginProcessSignal.value || isInSignUpProcessSignal.value) {
        if (tempPasswordSignal.value.length > 0) {
          tempPasswordSignal.value = tempPasswordSignal.value.slice(0, -1);
          instance?.write('\b \b');
        }
      } else if (cursorX > TERMINAL_CONSTANTS.PROMPT_LENGTH) {
        instance?.write('\b \b');
        const newCommandLine = _commandLineState.slice(0, -1);
        setCommandLine(newCommandLine);
        _setCommandLineState(newCommandLine);
      }
    };

    const handleData = (data: string) => {
      if (instance == null) return;
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
      return;
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
  }, [instance, getCurrentCommand, resetPrompt, wpmCalculator, commandLine, navigateHistory, handleCharacter, _commandLineState, handleCommand, setCommandHistoryIndex]);

  return {
    xtermRef,
    writeToTerminal,
    resetPrompt,
  };
};
