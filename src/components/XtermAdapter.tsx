import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import '@xterm/xterm/css/xterm.css';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { ITerminalInitOnlyOptions, ITerminalOptions } from '@xterm/xterm';
import { TerminalCssClasses } from '../types/TerminalTypes';
import { XtermAdapterConfig } from './XtermAdapterConfig';

export interface XtermAdapterProps {
  onAddCharacter: (data: string) => void;
  onRemoveCharacter: (command: string) => void;
  terminalFontSize: number;
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

export const XtermAdapter: React.FC<XtermAdapterProps> = (props: XtermAdapterProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);

  const options: ITerminalOptions & ITerminalInitOnlyOptions = XtermAdapterConfig;

  const handleData = useCallback((data: string) => {
    props.onAddCharacter(data);
  }, [props]);

  const terminalMethods: XtermAdapterMethods = useMemo(() => ({
    focusTerminal: () => terminalInstance.current?.focus(),
    terminalWrite: (data: string) => terminalInstance.current?.write(data),
    getCurrentCommand: () => '', // This needs to be implemented differently
    getTerminalSize: () => terminalInstance.current ? { width: terminalInstance.current.cols, height: terminalInstance.current.rows } : undefined,
    terminalReset: () => terminalInstance.current?.reset(),
    prompt: () => {
      terminalInstance.current?.write('\r\n$ ');
    },
    appendTempPassword: (password: string) => terminalInstance.current?.write(password),
    scrollBottom: () => terminalInstance.current?.scrollToBottom(),
  }), []);

  useEffect(() => {
    if (!terminalRef.current) return;

    terminalInstance.current = new Terminal(options);
    fitAddon.current = new FitAddon();
    terminalInstance.current.loadAddon(fitAddon.current);

    terminalInstance.current.open(terminalRef.current);

    // Ensure the terminal is fully rendered before fitting
    setTimeout(() => {
      if (fitAddon.current && terminalInstance.current) {
        fitAddon.current.fit();
      }
    }, 0);

    fitAddon.current.fit();

    terminalInstance.current.onData(handleData);
    terminalInstance.current.write('$ ');
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
    if (!terminalInstance.current) return;

    const handleKey = (event: KeyboardEvent) => {
      event.preventDefault();
      const key = event.key;

      if (key === 'Enter') {
        terminalInstance.current?.write('\r\n');
        const command = terminalInstance.current?.buffer.active.getLine(terminalInstance.current.buffer.active.cursorY)?.translateToString().trim() || '';
        const [cmd, ...args] = command.split(' ');
        props.onCommandExecuted(cmd, args, {});
        terminalInstance.current?.write('\r\n$ ');
      } else if (key === 'Backspace') {
        if (terminalInstance 
          && terminalInstance.current 
          && terminalInstance.current?.buffer?.active?.cursorX > 2
        ) {
          terminalInstance.current?.write('\b \b');
          props.onRemoveCharacter(key);
        }
      } else {
        terminalInstance.current?.write(key);
        props.onAddCharacter(key);
      }
    };

    terminalInstance.current.attachCustomKeyEventHandler((event) => {
      if (event.type === 'keydown') {
        handleKey(event);
        return false;
      }
      return true;
    });
  }, [props]);

  useEffect(() => {
    const handleResize = () => {
      if (fitAddon.current && terminalInstance.current) {
        // Ensure the terminal is visible and has dimensions before fitting
        if (terminalRef.current?.offsetHeight && terminalRef.current?.offsetWidth) {
          fitAddon.current.fit();
        } else {
          // If the terminal is not visible, try again after a short delay
          setTimeout(() => fitAddon.current?.fit(), 100);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

