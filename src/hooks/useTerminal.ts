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
import { isInLoginProcessSignal, setActivity, setIsInLoginProcess, setTempPassword, setTempUserName, tempPasswordSignal, tempUserNameSignal } from 'src/signals/appSignals';
import { ActivityType, ParsedCommand } from 'src/types/Types';
import { IUseCharacterHandlerProps, useCharacterHandler } from './useCharacterHandler';
import { isLoggedInSignal, setIsLoggedIn, userNameSignal, setUserName } from '../signals/appSignals';
import { useAuth } from 'src/lib/useAuth';
import { parseCommand } from 'src/utils/commandUtils';
import { write } from 'fs';


export const useTerminal = () => {
  const { instance, ref: xtermRef } = useXTerm({ options: XtermAdapterConfig });
  const { handleCommand } = useCommand();
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
    instance.reset();
    setCommandLine('');
    instance.write(PROMPT);
    instance.scrollToBottom();
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

  useEffect(() => {
    if (!instance) return;
    instance.loadAddon(fitAddon.current);
    fitAddon.current.fit();
    resetPrompt();
  }, [instance])

  useEffect(() => {
    if (!instance) return;

    const handleData = (data: string) => {
      if (!instance) return;
      const cursorX = instance.buffer.active.cursorX;

      // Handle special control characters first
      switch (data) {
        case '\x03': // Ctrl+C
          setCommandLine('');
          setActivity(ActivityType.NORMAL);
          instance.write('^C');
          resetPrompt();
          return;

        case '\r': // Enter key
          if (isInLoginProcessSignal.value) {
            // Handle login completion
            const loginCommand = parseCommand([
              'login',
              tempUserNameSignal.value,
              tempPasswordSignal.value
            ].join(' '));
            handleCommand(loginCommand);
            setIsInLoginProcess(false);
            setTempPassword('');
            setTempUserName('');
          } else {
            // Handle normal command execution
            const currentCommand = getCurrentCommand();
            const parsedCommand = parseCommand(currentCommand === '' ? '\r' : currentCommand);
            instance.write('\r\n');
            setCommandLine('');
            handleCommand(parsedCommand);
            wpmCalculator.clearKeystrokes();
          }
          resetPrompt();
          return;

        case '\x7F': // Backspace
          if (isInLoginProcessSignal.value) {
            if (tempPasswordSignal.value.length > 0) {
              tempPasswordSignal.value = tempPasswordSignal.value.slice(0, -1);
              instance.write('\b \b');
            }
          } else if (cursorX > promptLength) {
            instance.write('\b \b');
            setCommandLine(commandLine.value.slice(0, -1));
          }
          return;

        case '\x1b[D': // Left arrow
          if (cursorX > promptLength) {
            instance.write(data);
          }
          return;
      }

      // Handle regular character input
      if (isInLoginProcessSignal.value) {
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
  }, [instance, getCurrentCommand, resetPrompt, wpmCalculator, commandLine, setCommandLine]);

  return {
    xtermRef,
    writeToTerminal,
    resetPrompt,
  };
};
