import React, { useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { ITerminalInitOnlyOptions, ITerminalOptions } from '@xterm/xterm';
import { TerminalCssClasses } from '../types/TerminalTypes';
import { XtermAdapterConfig } from './XtermAdapterConfig';

export interface XtermAdapterProps {
  onCharacterInput: (data: string) => void;
  onRemoveCharacter: (command: string) => void;
  terminalFontSize: number;
  commandLine: string;
  onCommandExecuted: (command: string, args: string[], switches: Record<string, string | boolean>) => void;
  onTerminalReady: (methods: XtermAdapterMethods) => void;
}

export interface XtermAdapterMethods {
  focusTerminal: () => void;
  terminalWrite: (data: string) => void;
  getCurrentCommand: () => string;
  getTerminalSize: () => { width: number; height: number } | undefined;
  terminalReset: () => void;
  prompt: () => void;
  appendTempPassword: (password: string) => void;
  scrollBottom: () => void;
}

const XtermAdapterComponent: React.FC<XtermAdapterProps> = (props: XtermAdapterProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);

  const options: ITerminalOptions & ITerminalInitOnlyOptions = XtermAdapterConfig;

  const promptDelimiter = '$';
  const promptLength = useRef(0);

  useEffect(() => {
    if (terminalInstance.current) {
      terminalInstance.current.write(props.commandLine);
      const currentCommand = getCurrentCommand();
      console.log('%c XtermAdapter: Current command line:', 'color: cyan; font-weight: bold;', currentCommand);
    }
  }, [props.commandLine]);

  const setViewPortOpacity = (): void => {
    const viewPort = document.getElementsByClassName('xterm-viewport')[0] as
      HTMLDivElement;
    viewPort.style.opacity = "0.0";
  };

  const fitInitChar = () => {
    fitAddon.current?.fit();
    terminalInstance.current?.write('\x1b[4h');
  }

  const getCurrentCommand = (): string => {
    const buffer = terminalInstance.current.buffer.active;
    let command = '';
    for (let i = 0; i <= buffer.cursorY; i++) {
      const line = buffer.getLine(i);
      if (line) {
        command += line.translateToString(true);
      }
    }
    const promptEndIndex = command.indexOf(promptDelimiter) + 1;
    return command.substring(promptEndIndex).trimStart();
  };

  const handleData = useCallback((data: string) => {
    console.log('Terminal received data:', data);
    if (data === '\r') { // Enter key
      console.log('XtermAdapter: Enter key pressed, current buffer:', terminalInstance.current?.buffer.active.getLine(terminalInstance.current.buffer.active.cursorY)?.translateToString());
      terminalInstance.current?.write('\r\n');
      console.log('XtermAdapter: Enter key pressed');
      const command = terminalInstance.current?.buffer.active.getLine(terminalInstance.current.buffer.active.cursorY - 1)?.translateToString().trim() || '';
      const [cmd, ...args] = command.split(' ');
      props.onCommandExecuted(cmd, args, {});
    } else if (data === '\x7F') { // Backspace
      if (terminalInstance && terminalInstance.current && terminalInstance.current?.buffer.active.cursorX > 2) {
        console.log('XtermAdapter: Backspace pressed, current buffer before:', terminalInstance.current.buffer.active.getLine(terminalInstance.current.buffer.active.cursorY)?.translateToString());
        terminalInstance.current.write('\b \b');
        props.onRemoveCharacter(props.commandLine);
        console.log('XtermAdapter: Backspace pressed');
      }
    } else if (data === '\x1b[A') { // Up arrow
      // Handle up arrow (e.g., navigate command history)
    } else if (data === '\x1b[B') { // Down arrow
      // Handle down arrow
    } else if (data === '\x1b[C') { // Right arrow
      // Move cursor right
    } else if (data === '\x1b[D') { // Left arrow
      // Move cursor left
    } else if (data === '\x1b[H') { // Home key
      // Move cursor to beginning of line
      // You might need to implement custom logic for this
    } else if (data === '\x1b[F') { // End key
      // Move cursor to end of line
      // You might need to implement custom logic for this
    } else if (data === '\x03') { // Ctrl+C
      // Handle Ctrl+C (e.g., cancel current operation)
      terminalInstance.current?.write('^C');
      props.onCommandExecuted('', [], {}); // Cancel current command                      
      terminalInstance.current?.write('\r\n$ ');
      console.log('XtermAdapter: Ctrl+C pressed, current buffer:', terminalInstance.current?.buffer.active.getLine(terminalInstance.current.buffer.active.cursorY)?.translateToString());
    } else {
      terminalInstance.current?.write(data);
      console.log('XtermAdapter: Character written to terminal, current buffer:', terminalInstance.current?.buffer.active.getLine(terminalInstance.current.buffer.active.cursorY)?.translateToString());
      console.log('XtermAdapter: Character input:', data);
      props.onCharacterInput(data);
    }
  }, [props.onCharacterInput, props.onRemoveCharacter, props.onCommandExecuted]);

  const terminalMethods: XtermAdapterMethods = useMemo(() => ({
    focusTerminal: () => terminalInstance.current?.focus(),
    terminalWrite: (data: string) => terminalInstance.current?.write(data),
    getCurrentCommand: () => {
      console.log('XtermAdapter: Getting current command');
      const command = terminalInstance.current?.buffer.active.getLine(terminalInstance.current.buffer.active.cursorY)?.translateToString().trim() || '';
      return command;
    },
    getTerminalSize: () => terminalInstance.current ? { width: terminalInstance.current.cols, height: terminalInstance.current.rows } : undefined,
    terminalReset: () => terminalInstance.current?.reset(),
    prompt: () => {
      terminalInstance.current?.write('$ ');
      console.log('XtermAdapter: Prompt written, current buffer:', terminalInstance.current?.buffer.active.getLine(terminalInstance.current.buffer.active.cursorY)?.translateToString());
    },
    appendTempPassword: (password: string) => terminalInstance.current?.write(password),
    scrollBottom: () => terminalInstance.current?.scrollToBottom(),
  }), []);

  useEffect(() => {
    if (!terminalRef.current) return;

    terminalInstance.current = new Terminal(options);
    fitAddon.current = new FitAddon();
    terminalInstance.current.loadAddon(fitAddon.current);

    setTimeout(() => {
      if (fitAddon.current && terminalInstance.current) {
        try {
          // fitAddon.current.fit();
          fitInitChar();
        } catch (error) {
          console.error('Error fitting terminal:', error);
        }
      }
    }, 0);

    terminalInstance.current.open(terminalRef.current);
    terminalInstance.current.onData(handleData);
    props.onTerminalReady(terminalMethods);

    // Make the terminal visible after initialization
    if (terminalRef.current) {
      terminalRef.current.style.visibility = 'visible';
    }

    return () => {
      terminalInstance.current?.dispose();
    }
  }, [handleData, props, terminalMethods]);

  useEffect(() => {
    const handleResize = () => {
      if (fitAddon.current && terminalInstance.current) {
        // Ensure the terminal is visible and has dimensions before fitting
        if (terminalRef && terminalRef.current && terminalRef.current?.offsetHeight > 0 && terminalRef.current?.offsetWidth > 0) {
          try {
            // fitAddon.current.fit();
            fitInitChar();
            console.log('Terminal fitted on resize');
          } catch (error) {
            console.error('Error fitting terminal on resize:', error);
          }
        } else {
          // If the terminal is not visible, try again after a short delay
          setTimeout(() => fitInitChar(), 100);
        }
      }
    };

    setViewPortOpacity();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const terminalElement = document.getElementById(TerminalCssClasses.Terminal);
    if (terminalElement) {
      console.log('XtermAdapter: Terminal element visibility:', window.getComputedStyle(terminalElement).visibility);
    }
  }, []);

  return (
    <div
      ref={terminalRef}
      id={TerminalCssClasses.Terminal}
      className={TerminalCssClasses.Terminal}
      style={{ height: '100%', width: '100%', visibility: 'hidden' }}
    />
  );
};

export const XtermAdapter = memo(XtermAdapterComponent);
