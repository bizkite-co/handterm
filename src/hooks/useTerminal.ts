// hooks/useTerminal.ts
import React, { useCallback, useState, useEffect, useRef, MutableRefObject } from 'react';
import { useXTerm } from 'react-xtermjs';
import { FitAddon } from '@xterm/addon-fit';
import { XtermAdapterConfig } from '../components/XtermAdapterConfig';
import { useCommand } from './useCommand';
import { useWPMCalculator } from './useWPMCaculator';
import { WPM } from 'src/types/Types';

export const useTerminal = () => {
  const { instance, ref: xtermRef } = useXTerm({ options: XtermAdapterConfig });
  const { handleCommand } = useCommand();
  const wpmCalculator = useWPMCalculator();

  const [commandLine, setCommandLine] = useState('');
  const [currentWPMs, setCurrentWPMs] = useState<WPM[]>([]);
  const fitAddon = useRef(new FitAddon());
  const PROMPT = '> ';
  const promptLength = PROMPT.length;

  const writeToTerminal = useCallback((data: string) => {
    instance?.write(data);
  }, [instance]);

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

  const resetPrompt = useCallback(() => {
    if (!instance) return;
    instance.reset();
    setCommandLine('');
    instance.write(PROMPT);
    instance.scrollToBottom();
  }, [instance]);

  useEffect(() =>{
    if(!instance) return;
    instance.loadAddon(fitAddon.current);
    fitAddon.current.fit();
    resetPrompt();
  }, [instance])

  useEffect(() => {
    if (!instance) return;

    const handleData = (data: string) => {
      if (!instance) return;
      const cursorX = instance.buffer.active.cursorX;
      if (data === '\r') { // Enter key
        const currentCommand = getCurrentCommand();
        instance.write('\r\n');
        const wpms = wpmCalculator.getWPMs();
        handleCommand(currentCommand, wpms);
        resetPrompt();
        wpmCalculator.clearKeystrokes();
      } else if (data === '\x7F') { // Backspace
        if (cursorX > promptLength) {
          instance.write('\b \b');
          setCommandLine(prev => prev.slice(0, -1));
        }
      } else if (data === '\x1b[D') { // Left arrow
        if (cursorX > promptLength) {
          instance.write(data);
        }
      } else {
        setCommandLine(prev => prev + data);
        instance.write(data);
        wpmCalculator.addKeystroke(data);
      }
    }
    const resizeHandler = () => { fitAddon.current.fit(); instance.scrollToBottom(); };
    window.addEventListener('resize', resizeHandler);

    const dataHandler = instance.onData(handleData);

    return () => {
      window.removeEventListener('resize', resizeHandler);
      dataHandler.dispose();
    };
}, [instance, getCurrentCommand, resetPrompt, wpmCalculator, commandLine ]);

  return {
    xtermRef,
    commandLine,
    writeToTerminal,
    resetPrompt,
  };
};
