// hooks/useTerminal.ts
import { useCallback, useState, useEffect, useRef, MutableRefObject } from 'react';
import { useXTerm } from 'react-xtermjs';
import { FitAddon } from '@xterm/addon-fit';
import { XtermAdapterConfig } from '../components/XtermAdapterConfig';
import { useCommand } from './useCommand';
import { useWPMCalculator } from './useWPMCaculator';
import { addKeystroke, commandLineSignal, setCommand } from 'src/signals/commandLineSignals';
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
  tempUserNameSignal,
  activitySignal
} from 'src/signals/appSignals';
import { ActivityType, ParsedCommand } from 'src/types/Types';
import { IUseCharacterHandlerProps, useCharacterHandler } from './useCharacterHandler';
import { isLoggedInSignal, setIsLoggedIn, userNameSignal, setUserName } from '../signals/appSignals';
import { useAuth } from 'src/hooks/useAuth';
import { parseCommand } from 'src/utils/commandUtils';
import { write } from 'fs';


export const useTerminal = () => {
  const { instance, ref: xtermRef } = useXTerm({ options: XtermAdapterConfig });
  const { handleCommand, commandHistory, commandHistoryIndex, setCommandHistoryIndex } = useCommand();
  const wpmCalculator = useWPMCalculator();
  const commandLine = useComputed(() => commandLineSignal.value)

  const fitAddon = useRef(new FitAddon());
  const PROMPT = '> ';
  const promptLength = PROMPT.length;

  const writeToTerminal = useCallback((data: string) => {
    instance?.write(data);
  }, [instance]);

  const resetPrompt = useCallback(() => {
    if (!instance) return;

    // Only reset and write prompt if not in a specific process
    if (!isInLoginProcessSignal.value &&
        !isInSignUpProcessSignal.value &&
        activitySignal.value === ActivityType.NORMAL) {
      instance.reset();
      setCommandLine('');
      instance.write(PROMPT);
      instance.scrollToBottom();
    }
  }, [instance]);

  const {
    handleCharacter,
  } = useCharacterHandler({
    setLastTypedCharacter: (value:string|null)=>{}, // Implement if needed
    isInSvgMode: false, // Set appropriately
    writeOutputInternal: writeToTerminal,
  } as IUseCharacterHandlerProps);


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
    const promptEndIndex = command.indexOf(PROMPT) + promptLength;
    return command.substring(promptEndIndex).trimStart();
  }, [instance]);

  const clearCurrentLine = useCallback(() => {
    if (!instance) return;
    const currentCommand = getCurrentCommand();
    // Move cursor to end of line
    instance.write('\x1b[2K\r'); // Clear the current line
    instance.write(PROMPT); // Rewrite prompt
  }, [instance, getCurrentCommand]);

  const navigateHistory = useCallback((direction: 'up' | 'down') => {
    if (!instance || !commandHistory.length) return;

    let newIndex = commandHistoryIndex;

    if (direction === 'up') {
      // If we're not already navigating history, save current command
      if (newIndex === -1) {
        const currentCommand = getCurrentCommand();
        if (currentCommand) {
          setCommandLine(currentCommand);
        }
      }
      newIndex = newIndex === -1 ? commandHistory.length - 1 : Math.max(0, newIndex - 1);
    } else {
      newIndex = newIndex === -1 ? -1 : Math.min(commandHistory.length - 1, newIndex + 1);
      if (newIndex === -1) {
        // Restore the saved command when reaching the bottom
        clearCurrentLine();
        const savedCommand = commandLine.value;
        if (savedCommand) {
          instance.write(savedCommand);
          setCommandLine(savedCommand);
        }
        setCommandHistoryIndex(newIndex);
        return;
      }
    }

    clearCurrentLine();
    const historicalCommand = commandHistory[newIndex] || '';
    instance.write(historicalCommand);
    setCommandLine(historicalCommand);
    setCommandHistoryIndex(newIndex);
  }, [instance, commandHistory, commandHistoryIndex, getCurrentCommand, clearCurrentLine, setCommandHistoryIndex]);

  useEffect(() => {
    if (!instance) return;
    instance.loadAddon(fitAddon.current);
    fitAddon.current.fit();
    resetPrompt();
  }, [instance])

  useEffect(() => {
    if (!instance) return;

    const handleControlCharacters = (data: string, cursorX: number) => {
      switch (data) {
        case '\x03': // Ctrl+C
          setCommandLine('');
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
          if (cursorX > promptLength) {
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
        const parsedCommand = parseCommand(currentCommand === '' ? '\r' : currentCommand);
        instance?.write('\r\n');
        setCommandLine('');
        handleCommand(parsedCommand);
        wpmCalculator.clearKeystrokes();
      }
      setCommandHistoryIndex(-1); // Reset history index after command execution
      resetPrompt();
    };

    const handleBackspace = (cursorX: number) => {
      if (isInLoginProcessSignal.value || isInSignUpProcessSignal.value) {
        if (tempPasswordSignal.value.length > 0) {
          tempPasswordSignal.value = tempPasswordSignal.value.slice(0, -1);
          instance?.write('\b \b');
        }
      } else if (cursorX > promptLength) {
        instance?.write('\b \b');
        setCommandLine(commandLine.value.slice(0, -1));
      }
    };

    const handleData = (data: string) => {
      if (!instance) return;
      const cursorX = instance.buffer.active.cursorX;

      if (handleControlCharacters(data, cursorX)) {
        return;
      }

      // Handle regular character input
      if (isInLoginProcessSignal.value || isInSignUpProcessSignal.value) {
        tempPasswordSignal.value += data;
        handleCharacter(data); // This will handle masking
      } else {
        const newCommandLine = commandLine.value + data;
        instance.write(data);
        setCommandLine(newCommandLine);
        addKeystroke(data);
      }
    };

    const resizeHandler = () => { fitAddon.current.fit(); instance.scrollToBottom(); };
    window.addEventListener('resize', resizeHandler);

    const dataHandler = instance.onData(handleData);

    return () => {
      window.removeEventListener('resize', resizeHandler);
      dataHandler.dispose();
    };
  }, [instance, getCurrentCommand, resetPrompt, wpmCalculator, commandLine, setCommandLine, navigateHistory]);

  return {
    xtermRef,
    writeToTerminal,
    resetPrompt,
  };
};
