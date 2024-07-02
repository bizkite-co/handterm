// XtermAdapter.ts
import React, { TouchEventHandler } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { TerminalCssClasses } from '../types/TerminalTypes';
import { XtermAdapterConfig } from './XtermAdapterConfig';

interface IXtermAdapterState {

}

interface IXtermAdapterProps {
  terminalElement: HTMLElement | null;
  terminalElementRef: React.RefObject<HTMLElement>;
  onAddCharacter: (character: string) => void;
  onTouchStart: TouchEventHandler<HTMLDivElement>;
  onTouchEnd: TouchEventHandler<HTMLDivElement>;
  terminalFontSize: number;
}

export class XtermAdapter extends React.Component<IXtermAdapterProps, IXtermAdapterState> {
  private terminal: Terminal;
  public terminalRef: React.RefObject<HTMLElement>;
  private promptDelimiter: string = '$';
  private promptLength: number = 0;
  public isShowVideo: boolean = false;
  private fitAddon = new FitAddon();
  private isDebug: boolean = false;
  private onDataDisposable: import("@xterm/xterm").IDisposable | null = null;
  private tempPassword: string = '';

  constructor(props: IXtermAdapterProps) {
    super(props);
    const { terminalElementRef } = props;
    this.terminalRef = terminalElementRef;
    this.state = {
    }
    this.terminal = new Terminal(XtermAdapterConfig);
    this.onDataHandler = this.onDataHandler.bind(this);
  }

  initializeTerminal() {
    const { terminalElementRef } = this.props;
    if (terminalElementRef?.current) {
      this.terminalRef = terminalElementRef;
      this.terminal.open(terminalElementRef.current);
      this.terminal.loadAddon(this.fitAddon);
      this.fitAddon.fit();
      this.terminal.write('\x1b[4h');
      this.focusTerminal();
      // Other terminal initialization code...
    }
  }

  public focusTerminal() {
    // Logic to focus the terminal goes here
    this.terminal.focus();
    this.terminal.scrollToBottom();
  }
  public appendTempPassword(passwordChar: string) {
    this.tempPassword += passwordChar; 
  }
  public resetTempPassword() {
    this.tempPassword = '';
  }
  public getTempPassword() {
    return this.tempPassword;
  }

  terminalReset(): void {
    this.terminal.reset();
  }

  terminalWrite(data: string): void {
    this.terminal.write(data);
  }

  getTerminalText(): string {
    return this.getCurrentCommand();
  }

  handleResize = () => {
    // Assuming fitAddon is stored as a class member
    this.fitAddon?.fit();
  }
  componentDidMount() {
    const { terminalElementRef } = this.props;
    if (terminalElementRef?.current) {
      this.initializeTerminal();
    } else {
      console.error('terminalElementRef.current is NULL');
    }
    this.onDataDisposable = this.terminal.onData(this.onDataHandler);
    this.terminal.onCursorMove(() => {
    })
    // this.loadCommandHistory();
    this.setViewPortOpacity();
    this.terminal.focus();
    this.prompt();
    window.addEventListener('resize', this.handleResize);
    this.scrollBottom()
    this.focusTerminal();
  }

  scrollBottom = () => {
    this.terminal.scrollToBottom();
  }

  componentDidUpdate(_prevProps: Readonly<IXtermAdapterProps>): void {
    // if (_prevProps.terminalElementRef?.current !== this.props.terminalElementRef?.current) {
    //   this.initializeTerminal();
    // }
    this.focusTerminal();
    this.scrollBottom();
  }

  componentWillUnmount(): void {
    if (this.onDataDisposable) {
      this.onDataDisposable.dispose();
    }
    window.removeEventListener('resize', this.handleResize);
  }

  setCursorMode(terminal: Terminal) {
    terminal.options.cursorBlink = true;
    terminal.options.cursorStyle = 'block';
    terminal.write('\x1b[4h');
  }

  handleBackSpaceAndNavigation(data: string): boolean {
    let result = false;
    if (data.charCodeAt(0) === 127) {
      if (this.isCursorOnPrompt()) return true;
      this.tempPassword = this.tempPassword.slice(0, -1);
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
  isCursorOnFirstLine(): boolean {
    return this.terminal.buffer.active.cursorY === 0;
  }

  onDataHandler(data: string): void {
    // TODO: Move business logic to HandexTerm and just leave `@xterm/xterm.js` handling features in here.
    const charCodes = data.split('').map(char => char.charCodeAt(0)).join(',');
    if (this.isDebug) {
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
            // TODO: Handle Home key
            this.terminal.write(`\x1b[${this.promptLength + 1}G`);
            return;
          }
        }
        if (data.charCodeAt(2) === 65 && this.isCursorOnFirstLine()) {
          // UP Arrow
          // TODO: Handle UP Arrow key command history.
          this.props.onAddCharacter('ArrowUp')
          return;
        }
        if (
          data.charCodeAt(2) === 68
          && this.isCursorOnPrompt()
        ) { return; }
      }
    }
    this.props.onAddCharacter(data);
  }

  private setViewPortOpacity(): void {
    const viewPort = document.getElementsByClassName('xterm-viewport')[0] as HTMLDivElement;
    viewPort.style.opacity = "0.0";
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
  promptLogin() {
    this.terminal.writeln('Welcome to Handex Term!');
    this.terminal.writeln('Login:');
    this.terminal.write('Username: ');
    let username = '';
    let password = '';
    let isUsernameComplete = false;

    this.terminal.onKey(({ key, domEvent }) => {
      const char = domEvent.key;

      if (key === 'Enter') { // Enter key
        if (isUsernameComplete) {
          // Here you would call the login function with username and password
          // and handle the authentication result.
          this.terminal.writeln('');
        } else {
          isUsernameComplete = true;
          this.terminal.writeln('');
          this.terminal.write('Password: ');
        }
      } else if (key.charCodeAt(0) === 127) {
        if (this.isCursorOnPrompt()) return true;
        this.terminal.write('\x1b[D\x1b[P');
      } else {
        // Append typed character to 'username' or 'password'
        if (isUsernameComplete) {
          password += char;
        } else {
          username += char;
        }
      }
    });
  }

  public getTerminalSize(): { width: number; height: number } | undefined {
    if (this.terminalRef.current) {
      return {
        width: this.terminalRef.current.clientWidth,
        height: this.terminalRef.current.clientHeight,
      };
    }
    return undefined;
  }

  render() {
    // Use state and refs in your render method
    return (
      <>
        <div
          ref={this.terminalRef as React.RefObject<HTMLDivElement>}
          id={TerminalCssClasses.Terminal}
          className={TerminalCssClasses.Terminal}
        />
      </>
    );
  }
}