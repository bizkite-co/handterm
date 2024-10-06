// hooks/useTerminal.ts
import React, { useCallback, useState, useEffect, useRef, MutableRefObject } from 'react';
import { useXTerm } from 'react-xtermjs';
import { FitAddon } from '@xterm/addon-fit';
import { XtermAdapterConfig } from '../components/XtermAdapterConfig';
import { IWPMCalculator } from '../utils/WPMCalculator';
import { IHandTermWrapperMethods } from 'src/components/HandTermWrapper';

interface UseTerminalProps {
  wpmCalculator: IWPMCalculator;
  handTermRef: React.RefObject<IHandTermWrapperMethods>;
  onCommandExecuted: (command: string) => void;
}

export const useTerminal = ({ wpmCalculator, onCommandExecuted }: UseTerminalProps) => {
  const { instance, ref: xtermRef } = useXTerm({ options: XtermAdapterConfig });
  const [commandLine, setCommandLine] = useState('');
  const fitAddon = useRef(new FitAddon());
  const PROMPT = '> ';
  const promptLength = PROMPT.length;

  const writeToTerminal = useCallback((data: string) => {
    instance?.write(data);
  }, [instance]);

  const getCurrentLine = useCallback(() => {
    if (!instance) return '';
    const buffer = instance.buffer.active;
    const lineContent = buffer.getLine(buffer.cursorY)?.translateToString() || '';
    return lineContent.substring(promptLength);
  }, [instance]);

  const getCurrentCommand = useCallback(() => {
    if(!instance) return '';
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
    instance.write(PROMPT);
    instance.reset();
    setCommandLine('');
    instance.scrollToBottom();
  }, [instance]);

  const handleData = useCallback((data: string) => {
    if (!instance) return;
    const cursorX = instance.buffer.active.cursorX;
    if (data === '\r') { // Enter key
      const currentCommand = getCurrentCommand();
      instance.write('\r\n');
      onCommandExecuted(currentCommand);
      resetPrompt();
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
  }, [instance, getCurrentLine, onCommandExecuted, resetPrompt, wpmCalculator]);

  useEffect(() => {
    if (instance) {
      instance.loadAddon(fitAddon.current);
      fitAddon.current.fit();
      instance.write(PROMPT);

      const resizeHandler = () => { fitAddon.current.fit(); instance.scrollToBottom(); };
      window.addEventListener('resize', resizeHandler);

      const dataHandler = instance.onData(handleData);

      return () => {
        window.removeEventListener('resize', resizeHandler);
        dataHandler.dispose();
      };
    }
  }, [instance]);

  return {
    xtermRef,
    commandLine,
    writeToTerminal,
    resetPrompt,
  };
};
