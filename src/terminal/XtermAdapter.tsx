// XtermAdapter.ts
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { TerminalCssClasses } from './TerminalTypes';
import { IWebCam, WebCam } from '../utils/WebCam';
import React, { TouchEventHandler } from 'react';

interface IXtermAdapterState {
  commandLine: string;
  isInPhraseMode: boolean;
  isActive: boolean;
  outputElements: string[]
}

interface IXtermAdapterProps {
  terminalElement: HTMLElement | null;
  terminalElementRef: React.RefObject<HTMLElement>;
  onAddCharacter: (character: string) => void;
  writeData: (data: string) => void;
  resetTerminal: () => void;
}

export class XtermAdapter extends React.Component<IXtermAdapterProps, IXtermAdapterState> {
  private terminal: Terminal;
  private terminalElement: HTMLElement | null = null;
  private terminalElementRef: React.RefObject<HTMLElement>;
  private lastTouchDistance: number | null = null;
  private currentFontSize: number = 17;
  private videoElementRef: React.RefObject<HTMLVideoElement> = React.createRef();
  private promptDelimiter: string = '$';
  private promptLength: number = 0;
  private webCam: IWebCam | null = null;
  private isShowVideo: boolean = false;
  private fitAddon = new FitAddon();
  private isDebug: boolean = false;

  constructor(props: IXtermAdapterProps ) {
    super(props);
    const { terminalElementRef } = props;
    this.terminalElementRef = terminalElementRef;
    this.state = {
      commandLine: '',
      isInPhraseMode: false,
      isActive: false,
      outputElements: []
    }
    // this.videoElement = this.createVideoElement();
    // this.terminalElement.prepend(this.videoElement);
    this.terminal = new Terminal({
      fontFamily: '"Fira Code", Menlo, "DejaVu Sans Mono", "Lucida Console", monospace',
      cursorBlink: true,
      cursorStyle: 'block'
    });
  }

  initializeTerminal() {
    const { terminalElementRef } = this.props;
    if (terminalElementRef?.current) {
      this.terminalElementRef = terminalElementRef;
      this.terminalElement = terminalElementRef.current
      this.terminal.open(terminalElementRef.current);
      this.terminal.loadAddon(this.fitAddon);
      this.fitAddon.fit();
      this.terminal.write('\x1b[4h');
      // Other terminal initialization code...
    }
  }

  terminalReset(): void {
    this.terminal.reset();
  }

  terminalWrite(data: string): void {
    this.terminal.write(data);
  }


  componentDidUpdate(prevProps: Readonly<IXtermAdapterProps> ): void {
    if (prevProps.terminalElementRef?.current !== this.props.terminalElementRef?.current) {
      this.initializeTerminal();
    }
  }
  componentWillUnmount(): void {
    window.removeEventListener('resize', this.handleResize);
  }
  getTerminalText(): string {
    return this.getCurrentCommand();
  }
  
  handleResize = () => {
    // Assuming fitAddon is stored as a class member
    console.log('handleResize');
    this.fitAddon?.fit();
  }
  componentDidMount() {
    const { terminalElementRef } = this.props;
    if (terminalElementRef?.current) {
      this.initializeTerminal();
    } else {
      console.error('terminalElementRef.current is NULL');
    }
    this.terminal.onData(this.onDataHandler.bind(this));
    // this.terminal.onKey(this.onKeyHandler.bind(this));
    this.terminal.onCursorMove(() => {
      // console.log('Cursor moved', this.terminal.buffer.active.cursorX, this.terminal.buffer.active.cursorY);
    })
    // this.loadCommandHistory();
    this.setViewPortOpacity();
    this.loadFontSize();
    this.terminal.focus();
    this.prompt();
    if (this.videoElementRef.current) {
      this.webCam = new WebCam(this.videoElementRef.current);
    }
    window.addEventListener('resize', this.handleResize);
  }

  wpmCallback = () => {
    console.log("Timer not implemented");
  }

  setCursorMode(terminal: Terminal) {
    terminal.options.cursorBlink = true;
    terminal.options.cursorStyle = 'block';
    terminal.write('\x1b[4h');
  }

  handleBackSpaceAndNavigation(data: string): boolean {
    let result = false;
    if (data.charCodeAt(0) === 127) {
      if(this.isDebug) console.log('Backspace pressed', this.terminal.buffer.active.cursorX, this.terminal.buffer.active.cursorY);
      if (this.isCursorOnPrompt()) return true;
      this.terminal.write('\x1b[D\x1b[P');
      result = true;
    }
    return result;
  }

  isCursorOnPrompt(): boolean {
    const isFirstLine = this.terminal.buffer.active.cursorY === 0;
    const isLeftOfPromptChar = this.terminal.buffer.active.cursorX < this.promptLength;
    return isFirstLine && isLeftOfPromptChar;
  }

  onDataHandler(data: string): void {
    // TODO: Move business logic to HandexTerm and just leave `@xterm/xterm.js` handling features in here.
    const charCodes = data.split('').map(char => char.charCodeAt(0)).join(',');
    if(this.isDebug) {
      console.info('onDataHandler', data, charCodes, this.terminal.buffer.active.cursorX, this.terminal.buffer.active.cursorY);
    }
    // Set the cursor mode on the terminal
    this.setCursorMode(this.terminal);
    // Handle Backspace and Navigation keys
    if (this.handleBackSpaceAndNavigation(data)) return;
    if (data.charCodeAt(0) === 27) { // escape and navigation characters
      // TODO: Abstract out the prompt area no-nav-to.
      if (data.charCodeAt(1) === 91) {
        if (data.length > 2) {
          if (data.charCodeAt(2) === 72) { // HOME
            console.log('Home pressed');
            // TODO: Handle Home key
            // while(this.terminal.buffer.active.cursorX > this.promptLength) {
            //   this.terminal.write('\x1b[D');
            // }
            return;
          }
        }
        if (data.charCodeAt(2) === 65 && this.isCursorOnPrompt()) {
          return;
        }
        if (
          data.charCodeAt(2) === 68
          && this.isCursorOnPrompt()) {
          return;
        }
      }
    }
    this.props.onAddCharacter(data);
  }


  private setViewPortOpacity(): void {
    const viewPort = document.getElementsByClassName('xterm-viewport')[0] as HTMLDivElement;
    viewPort.style.opacity = "0.0";
    // const xtermScreen = document.getElementsByClassName('xterm-screen')[0] as HTMLDivElement;
    // const terminal = document.getElementById('terminal') as HTMLDivElement;
  }

  private loadFontSize(): void {
    const fontSize = localStorage.getItem('terminalFontSize');
    if (fontSize) {
      this.currentFontSize = parseInt(fontSize);
      document.documentElement.style.setProperty('--terminal-font-size', `${this.currentFontSize}px`);
      if (this.terminalElement) {

        this.terminalElement.style.fontSize = `${this.currentFontSize}px`;
      } else {
        console.error('XtermAdapter:211 - terminalElement is NULL');
      }
      this.terminal.options.fontSize = this.currentFontSize;
    }
  }

  public toggleVideo(): boolean {
    this.isShowVideo = !this.isShowVideo;
    this.webCam?.toggleVideo(this.isShowVideo);
    return this.isShowVideo;
  }

  public getCurrentCommand(): string {
    const buffer = this.terminal.buffer.active;
    // Assuming the command prompt starts at the top of the terminal (line 0)
    // Adjust the starting line accordingly if your prompt starts elsewhere
    let command = '';
    for (let i = 0; i <= buffer.cursorY; i++) {
      const line = buffer.getLine(i);
      if (line) {
        command += line.translateToString(true);
      }
    }
    const promptEndIndex = command.indexOf(this.promptDelimiter) + 1;
    return command.substring(promptEndIndex).trimStart();
    // return command;
  }

  prompt(user: string = 'guest', host: string = 'handex.io') {
    const promptText = `\x1b[1;34m${user}@${host} \x1b[0m\x1b[1;32m~${this.promptDelimiter}\x1b[0m `;
    this.promptLength = promptText.length - 21;
    this.terminal.write(promptText);
    // this.promptLength = this.terminal.buffer.active.cursorX;
  }

  // Method to render data to the terminal
  renderOutput(data: string): void {
    this.terminal.write(data);
  }

  public handleTouchStart: TouchEventHandler<HTMLDivElement> = (event: React.TouchEvent<HTMLDivElement>) => {
    setTimeout(() => {
      // this.terminalElement.focus();
    }, 500)
    if (event.touches.length === 2) {

      // event.preventDefault();
      this.lastTouchDistance = this.getDistanceBetweenTouches(event.touches);
    }
  }

  public handleTouchMove: TouchEventHandler<HTMLDivElement> = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2) {
      // event.preventDefault();
      const currentDistance = this.getDistanceBetweenTouches(event.touches);
      if (this.lastTouchDistance) {
        const scaleFactor = currentDistance / this.lastTouchDistance;
        this.currentFontSize *= scaleFactor;
        // TODO: Figure out how to resize fonts now with REact.
        document.documentElement.style.setProperty('--terminal-font-size', `${this.currentFontSize}px`);
        this.lastTouchDistance = currentDistance;
        this.terminal.options.fontSize = this.currentFontSize;
        this.terminal.refresh(0, this.terminal.rows - 1); // Refresh the terminal display
      }
    }
  }

  public increaseFontSize() {
    this.currentFontSize += 1;
    this.terminal.options.fontSize = this.currentFontSize;
    this.terminal.refresh(0, this.terminal.rows - 1);
    localStorage.setItem('terminalFontSize', `${this.currentFontSize}`);
  }

  public handleTouchEnd: TouchEventHandler<HTMLDivElement> = () => {

    localStorage.setItem('terminalFontSize', `${this.currentFontSize}`);
    console.log('SET terminalFontSize', this.currentFontSize);
    this.lastTouchDistance = null;
  }

  private getDistanceBetweenTouches(touches: React.TouchList): number {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.pageX - touch1.pageX, 2) +
      Math.pow(touch2.pageY - touch1.pageY, 2),
    );
  }

  render() {
    // Use state and refs in your render method
    return (
      <>
        <div
          ref={this.terminalElementRef as React.RefObject<HTMLDivElement>}
          id={TerminalCssClasses.Terminal}
          className={TerminalCssClasses.Terminal}
          onTouchStart={this.handleTouchStart}
          onTouchMove={this.handleTouchMove}
          onTouchEnd={this.handleTouchEnd}
        />
        <video
          ref={this.videoElementRef as React.RefObject<HTMLVideoElement>}
          id="terminal-video"
          hidden={!this.isShowVideo}
        ></video>
      </>
    );
  }
}