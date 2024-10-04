// hooks/useTerminal.ts
import { useCallback, useState, useEffect, useRef } from 'react';
import { useXTerm } from 'react-xtermjs';
import { FitAddon } from '@xterm/addon-fit';
import { XtermAdapterConfig } from '../components/XtermAdapterConfig';
import { IWPMCalculator } from '../utils/WPMCalculator';

interface UseTerminalProps {
  wpmCalculator: IWPMCalculator;
  onCommandExecuted: (command: string) => void;
}

export const useTerminal = ({ wpmCalculator, onCommandExecuted }: UseTerminalProps) => {
  const { instance, ref: xtermRef } = useXTerm({ options: XtermAdapterConfig });
  const [commandLine, setCommandLine] = useState('');
  const fitAddon = useRef(new FitAddon());
  const promptLength = useRef(2); // Length of "$ "

  const writeToTerminal = useCallback((data: string) => {
    instance?.write(data);
  }, [instance]);

  const getCurrentLine = useCallback(() => {
    if (!instance) return '';
    const buffer = instance.buffer.active;
    const lineContent = buffer.getLine(buffer.cursorY)?.translateToString() || '';
    return lineContent.substring(promptLength.current);
  }, [instance]);

  const resetPrompt = useCallback(() => {
    if (!instance) return;
    instance.write('\r\n$ ');
    setCommandLine('');
  }, [instance]);

  const handleData = useCallback((data: string) => {
    if (!instance) return;

    const cursorX = instance.buffer.active.cursorX;

    if (data === '\r') { // Enter key
      const currentCommand = getCurrentLine();
      onCommandExecuted(currentCommand);
      resetPrompt();
    } else if (data === '\x7F') { // Backspace
      if (cursorX > promptLength.current) {
        instance.write('\b \b');
        setCommandLine(prev => prev.slice(0, -1));
      }
    } else if (data === '\x1b[D') { // Left arrow
      if (cursorX > promptLength.current) {
        instance.write(data);
      }
    } else {
      instance.write(data);
      setCommandLine(prev => prev + data);
      wpmCalculator.addKeystroke(data);
    }
  }, [instance, getCurrentLine, onCommandExecuted, resetPrompt, wpmCalculator]);

  useEffect(() => {
    if (instance) {
      instance.loadAddon(fitAddon.current);
      fitAddon.current.fit();
      instance.write('$ ');

      const resizeHandler = () => fitAddon.current.fit();
      window.addEventListener('resize', resizeHandler);

      const dataHandler = instance.onData(handleData);

      return () => {
        window.removeEventListener('resize', resizeHandler);
        dataHandler.dispose();
      };
    }
  }, [instance, handleData]);

  return {
    xtermRef,
    commandLine,
    writeToTerminal,
    resetPrompt,
  };
};
