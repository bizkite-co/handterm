import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from    
 'react';
 import { FitAddon } from '@xterm/addon-fit';
 import { TerminalCssClasses } from '../types/TerminalTypes';
 import { XtermAdapterConfig } from './XtermAdapterConfig';

 export interface IXtermAdapterProps {
   terminalElementRef: React.RefObject<HTMLDivElement>;
   onAddCharacter: (character: string) => number;
   onRemoveCharacter: (command: string) => void;
   onTouchStart: React.TouchEventHandler<HTMLDivElement>;
   onTouchEnd: React.TouchEventHandler<HTMLDivElement>;
   terminalFontSize: number;
 }

 export interface XtermAdapterHandle {
   terminalElement: HTMLElement | null;
   terminalElementRef: React.RefObject<HTMLDivElement>;
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

 const XtermAdapter = forwardRef<XtermAdapterHandle, IXtermAdapterProps>((props, ref) =>
 {
   const { terminalElementRef, onAddCharacter, onRemoveCharacter, onTouchStart,
 onTouchEnd, terminalFontSize } = props;
   const [Terminal, setTerminal] = useState<any>(null);
   const terminalInstance = useRef<any>(null);
   const fitAddon = useRef(new FitAddon());
   const onDataDisposable = useRef<import("@xterm/xterm").IDisposable | null>(null);    
   const tempPassword = useRef('');
   const promptDelimiter = '$';
   const promptLength = useRef(0);
   const isDebug = useRef(false);

   useEffect(() => {
     import('@xterm/xterm').then(module => {
       setTerminal(() => module.Terminal);
     });
   }, []);

   useEffect(() => {
     if (Terminal && terminalElementRef.current) {
       terminalInstance.current = new Terminal(XtermAdapterConfig);
       terminalInstance.current.open(terminalElementRef.current);
       terminalInstance.current.loadAddon(fitAddon.current);
       fitAddon.current.fit();
       terminalInstance.current.write('\x1b[4h');
       focusTerminal();
       onDataDisposable.current = terminalInstance.current.onData(onDataHandler);       
       terminalInstance.current.onCursorMove(() => {});
       setViewPortOpacity();
       terminalInstance.current.focus();
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
     }
   }, [Terminal, terminalElementRef]);

   const focusTerminal = () => {
     terminalInstance.current.focus();
     scrollBottom();
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
     terminalInstance?.current?.reset();
   };

   const terminalWrite = (data: string) => {
     if (!data) return;
     terminalInstance?.current?.write(data);
   };

   const handleResize = () => {
     fitAddon.current?.fit();
   };

   const scrollBottom = () => {
     terminalInstance?.current?.scrollToBottom();
   };

   const setCursorMode = (terminal: any) => {
     terminal.options.cursorBlink = true;
     terminal.options.cursorStyle = 'block';
     terminal.write('\x1b[4h');
   };

   const handleBackSpaceAndNavigation = (data: string): boolean => {
     let result = false;
     if (data.charCodeAt(0) === 127) {
       if (isCursorOnPrompt()) return true;
       tempPassword.current = tempPassword.current.slice(0, -1);
       if (terminalInstance.current.buffer.active.cursorY > 0 &&
 terminalInstance.current.buffer.active.cursorX === 0) {
         terminalInstance.current.write('\x1b[A\x1b[999C\x1b[D\x1b[P');
       } else {
         terminalInstance.current.write('\x1b[D\x1b[P');
       }
       onRemoveCharacter(getCurrentCommand().slice(0, -1));
       result = true;
     }
     return result;
   };

   const isCursorOnPrompt = (): boolean => {
     const isFirstLine = terminalInstance.current.buffer.active.cursorY === 0;
     const isLeftOfPromptChar = terminalInstance.current.buffer.active.cursorX <        
 promptLength.current;
     return isFirstLine && isLeftOfPromptChar;
   };

   const isCursorOnFirstLine = (): boolean => {
     return terminalInstance.current.buffer.active.cursorY === 0;
   };

   const onDataHandler = (data: string): void => {
     const charCodes = data.split('').map(char => char.charCodeAt(0)).join(',');        
     if (isDebug.current) {
       console.info('onDataHandler', data, charCodes,
 terminalInstance.current.buffer.active.cursorX,
 terminalInstance.current.buffer.active.cursorY);
     }
     setCursorMode(terminalInstance.current);
     if (handleBackSpaceAndNavigation(data)) return;
     if (data.charCodeAt(0) === 27) {
       if (data.charCodeAt(1) === 91) {
         if (data.length > 2) {
           if (data.charCodeAt(2) === 72) {
             terminalInstance.current.write(`\x1b[${promptLength.current}G`);
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
     const viewPort = document.getElementsByClassName('xterm-viewport')[0] as
 HTMLDivElement;
     viewPort.style.opacity = "0.0";
   };

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

   const prompt = () => {
     terminalInstance.current.reset();
     const promptText = `~${promptDelimiter} `;
     promptLength.current = promptText.length + 1;
     terminalInstance.current.write(promptText);
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
       ref={terminalElementRef}
       id={TerminalCssClasses.Terminal}
       className={TerminalCssClasses.Terminal}
       onTouchStart={onTouchStart}
       onTouchEnd={onTouchEnd}
     />
   );
 });

 export default XtermAdapter;
