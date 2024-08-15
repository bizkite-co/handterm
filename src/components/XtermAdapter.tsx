import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { TerminalCssClasses } from '../types/TerminalTypes';
import { XtermAdapterConfig } from './XtermAdapterConfig';

export interface XtermAdapterHandle {
  terminalElement: HTMLElement | null;
  terminalElementRef: React.RefObject<HTMLElement>;
  onAddCharacter: (character: string) => void;
  onRemoveCharacter: (command: string) => void;
  onTouchStart: React.TouchEventHandler<HTMLDivElement>;
  onTouchEnd: React.TouchEventHandler<HTMLDivElement>;
  terminalFontSize: number;
  focusTerminal: () => void;
  scrollBottom: () => void;
  getTerminalSize: () => { width: number; height: number } | undefined;
  prompt: () => void;
  getCurrentCommand: () => string;
  terminalReset: () => void;
  terminalWrite: (data: string) => void;
  appendTempPassword: (passwordChar: string) => void;
  resetTempPassword: () => void;
  getTempPassword: () => string;
}

const XtermAdapter = forwardRef<XtermAdapterHandle, IXtermAdapterProps>((props, ref) => {
  const { terminalElementRef, onAddCharacter, onRemoveCharacter, onTouchStart, onTouchEnd, terminalFontSize } = props;
  const divRef = useRef<HTMLDivElement>(null);
  const terminal = useRef(new Terminal(XtermAdapterConfig));
  const fitAddon = useRef(new FitAddon());
  const onDataDisposable = useRef<import("@xterm/xterm").IDisposable | null>(null);
  const tempPassword = useRef('');
  const promptDelimiter = '$';
  const promptLength = useRef(0);
  const isDebug = useRef(false);

  const initializeTerminal = () => {
    if (terminalElementRef?.current) {
      terminal.current.open(terminalElementRef.current);
      terminal.current.loadAddon(fitAddon.current);
      fitAddon.current.fit();
      terminal.current.write('\x1b[4h');
      focusTerminal();
    }
  };

  const focusTerminal = () => {
    terminal.current.focus();
    terminal.current.scrollToBottom();
  };

  useImperativeHandle(ref, () => ({
    terminalElement: terminalElementRef.current,
    terminalElementRef,
    onAddCharacter,
    onRemoveCharacter,
    onTouchStart,
    onTouchEnd,
    terminalFontSize,
    scrollBottom,
    focusTerminal,
    getTerminalSize,
    prompt,
    getCurrentCommand,
    terminalReset,
    terminalWrite,
    appendTempPassword,
    resetTempPassword,
    getTempPassword,
  }));

  const appendTempPassword = (passwordChar: string) => {
    tempPassword.current += passwordChar;
  };

  const resetTempPassword = () => {
    tempPassword.current = '';
  };

  const getTempPassword = () => {
    return tempPassword.current;
  };

  const terminalReset = () => {
    terminal.current.reset();
  };

  const terminalWrite = (data: string) => {
    if (!data) return;
    terminal.current.write(data);
  };

  const getTerminalText = () => {
    return getCurrentCommand();
  };

  const handleResize = () => {
    fitAddon.current?.fit();
  };

  useEffect(() => {
    if (terminalElementRef?.current) {
      initializeTerminal();
    } else {
      console.error('terminalElementRef.current is NULL');
    }
    onDataDisposable.current = terminal.current.onData(onDataHandler);
    terminal.current.onCursorMove(() => {});
    setViewPortOpacity();
    terminal.current.focus();
    prompt();
    window.addEventListener('resize', handleResize);
    scrollBottom();
    focusTerminal();

    return () => {
      if (onDataDisposable.current) {
        onDataDisposable.current.dispose();
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [terminalElementRef]);

  const scrollBottom = () => {
    terminal.current.scrollToBottom();
  };

  const setCursorMode = (terminal: Terminal) => {
    terminal.options.cursorBlink = true;
    terminal.options.cursorStyle = 'block';
    terminal.write('\x1b[4h');
  };

  const handleBackSpaceAndNavigation = (data: string): boolean => {
    let result = false;
    if (data.charCodeAt(0) === 127) {
      if (isCursorOnPrompt()) return true;
      tempPassword.current = tempPassword.current.slice(0, -1);
      if (terminal.current.buffer.active.cursorY > 0 && terminal.current.buffer.active.cursorX === 0) {
        terminal.current.write('\x1b[A\x1b[999C\x1b[D\x1b[P');
      } else {
        terminal.current.write('\x1b[D\x1b[P');
      }
      onRemoveCharacter(getCurrentCommand().slice(0, -1));
      result = true;
    }
    return result;
  };

  const isCursorOnPrompt = (): boolean => {
    const isFirstLine = terminal.current.buffer.active.cursorY === 0;
    const isLeftOfPromptChar = terminal.current.buffer.active.cursorX < promptLength.current;
    return isFirstLine && isLeftOfPromptChar;
  };

  const isCursorOnFirstLine = (): boolean => {
    return terminal.current.buffer.active.cursorY === 0;
  };

  const onDataHandler = (data: string): void => {
    const charCodes = data.split('').map(char => char.charCodeAt(0)).join(',');
    if (isDebug.current) {
      console.info('onDataHandler', data, charCodes, terminal.current.buffer.active.cursorX, terminal.current.buffer.active.cursorY);
    }
    setCursorMode(terminal.current);
    if (handleBackSpaceAndNavigation(data)) return;
    if (data.charCodeAt(0) === 27) {
      if (data.charCodeAt(1) === 91) {
        if (data.length > 2) {
          if (data.charCodeAt(2) === 72) {
            terminal.current.write(`\x1b[${promptLength.current + 1}G`);
            return;
          }
        }
        if (data.charCodeAt(2) === 65 && isCursorOnFirstLine()) {
          onAddCharacter('ArrowUp');
          return;
        }
        if (data.charCodeAt(2) === 68 && isCursorOnPrompt()) {
          return;
        }
      }
    }
    onAddCharacter(data);
  };

  const setViewPortOpacity = (): void => {
    const viewPort = document.getElementsByClassName('xterm-viewport')[0] as HTMLDivElement;
    viewPort.style.opacity = "0.0";
  };

  const getCurrentCommand = (): string => {
    const buffer = terminal.current.buffer.active;
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

  const prompt = (user: string = 'guest', host: string = 'handex.io') => {
    terminal.current.reset();
    const promptText = `\x1b[1;34m${user}@${host} \x1b[0m\x1b[1;32m~${promptDelimiter}\x1b[0m `;
    promptLength.current = promptText.length - 21;
    terminal.current.write(promptText);
  };

  const promptLogin = () => {
    terminal.current.writeln('Welcome to Handex Term!');
    terminal.current.writeln('Login:');
    terminal.current.write('Username: ');
    let username = '';
    let password = '';
    let isUsernameComplete = false;

    terminal.current.onKey(({ key, domEvent }) => {
      const char = domEvent.key;

      if (key === 'Enter') {
        if (isUsernameComplete) {
          terminal.current.writeln('');
        } else {
          isUsernameComplete = true;
          terminal.current.writeln('');
          terminal.current.write('Password: ');
        }
      } else if (key.charCodeAt(0) === 127) {
        if (isCursorOnPrompt()) return true;
        terminal.current.write('\x1b[D\x1b[P');
      } else {
        if (isUsernameComplete) {
          password += char;
        } else {
          username += char;
        }
      }
    });
  };

  const getTerminalSize = (): { width: number; height: number } | undefined => {
    if (terminalElementRef.current) {
      return {
        width: terminalElementRef.current.clientWidth,
        height: terminalElementRef.current.clientHeight,
      };
    }
    return undefined;
  };

  return (
    <div
      ref={divRef}
      id={TerminalCssClasses.Terminal}
      className={TerminalCssClasses.Terminal}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    ></div>
  );
});

export default XtermAdapter;
