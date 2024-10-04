// hooks/useTerminal.ts
import { useCallback, useState, useEffect, useRef } from 'react';
import { useXTerm } from 'react-xtermjs';
import { FitAddon } from '@xterm/addon-fit';
import { XtermAdapterConfig } from '../components/XtermAdapterConfig';

export const useTerminal = () => {
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

  const handleData = useCallback((data: string) => {
    if (!instance) return;

    if (data === '\r') { // Enter key
      const currentCommand = getCurrentLine();
      instance.writeln('');
      // Handle command execution here
      console.log('Command executed:', currentCommand);
      setCommandLine('');
      instance.write('$ ');
    } else if (data === '\x7F') { // Backspace
      const currentLine = getCurrentLine();
      if (currentLine.length > 0) {
        instance.write('\b \b');
        setCommandLine(currentLine.slice(0, -1));
      }
    } else {
      const cursorX = instance.buffer.active.cursorX;
      if (cursorX >= promptLength.current) {
        instance.write(data);
        setCommandLine(prev => prev + data);
      }
    }
  }, [instance, getCurrentLine]);

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
  };
};