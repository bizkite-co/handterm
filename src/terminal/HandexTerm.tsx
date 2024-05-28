// HandexTerm.ts
import { LogKeys, TimeHTML, CharDuration, CharWPM } from './TerminalTypes';
import { IWPMCalculator, WPMCalculator } from './WPMCalculator';
import { IPersistence, LocalStoragePersistence } from './Persistence';
import { createHTMLElementFromHTML } from '../utils/dom';
import React, { TouchEventHandler } from 'react';
import { XtermAdapter } from './XtermAdapter';
import { NextCharsDisplay } from '../NextCharsDisplay';
import { Output } from '../terminal/Output';

export interface IHandexTermProps {
  // Define the interface for your HandexTerm logic

}

export interface IHandexTermState {
  // Define the interface for your HandexTerm state
  outputElements: React.ReactNode[];
  isInPhraseMode: boolean;
  isActive: boolean;
  commandLine: string;
}


export class HandexTerm extends React.Component<IHandexTermProps, IHandexTermState> {
  // Implement the interface methods
  terminalElementRef = React.createRef<HTMLDivElement>();
  private adapterRef = React.createRef<XtermAdapter>();
  private nextCharsDisplayRef: React.RefObject<NextCharsDisplay> = React.createRef();
  private _persistence: IPersistence;
  private _commandHistory: string[] = [];
  private wpmCalculator: IWPMCalculator = new WPMCalculator();
  private static readonly commandHistoryLimit = 100;
  private isDebug: boolean = false;


  constructor(IHandexTermProps: IHandexTermProps) {
    super(IHandexTermProps);
    this._persistence = new LocalStoragePersistence();
    this.state = {
      outputElements: this.getCommandHistory(),
      isInPhraseMode: false,
      isActive: false,
      commandLine: ''
    }
    this.loadDebugValue();
  }

  public handleCommand(command: string): string {
    let status = 404;
    let response = "Command not found.";
    if (command === 'clear') {
      status = 200;
      this.clearCommandHistory();
      return '';
    }
    if (command === 'play') {
      status = 200;
      response = "Would you like to play a game?"
    }
    if (command === 'phrase') {
      status = 200;
      response = "Type the phrase as fast as you can."
    }
    if (command.startsWith('video --')) {
      status = 200;
      if (command === 'video --true') {
        response = "Starting video camera..."
      }
      else {
        response = "Stopping video camera..."
      }
    }

    // Truncate the history if it's too long before saving
    if (this._commandHistory.length > HandexTerm.commandHistoryLimit) {
      this._commandHistory.shift(); // Remove the oldest command
    }
    let commandResponse = this.saveCommandResponseHistory(command, response, status); // Save updated history to localStorage
    return commandResponse;
  }

  parseCommand(input: string): void {
    const args = input.split(/\s+/); // Split the input by whitespace
    const command = args[0]; // The first element is the command

    // Now you can handle the command and options


    // Based on the command, you can switch and call different functions
    switch (command) {
      case 'someCommand':
        // Handle 'someCommand'
        break;
      // Add cases for other commands as needed
      default:
        // Handle unknown command
        break;
    }
  }

  getCommandHistory(): string[] {
    let keys: string[] = [];
    let commandHistory: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      if (!localStorage.key(i)?.startsWith(LogKeys.Command)) continue;

      const key = localStorage.key(i);
      if (!key) continue;
      keys.push(key);
    }
    keys.sort();
    for (let key of keys) {
      const historyJSON = localStorage.getItem(key);
      if (historyJSON) {
        commandHistory.push(historyJSON);
      }
    }
    return commandHistory;
  }

  private WpmsToHTML(wpms: CharWPM[], name: string | undefined) {
    name = name ?? "slowest-characters";
    return (
      <dl id={name} >
        {wpms.map((wpm, index) => (
          <React.Fragment key={index}>
            <dt>{wpm.character}</dt>
            <dd>{wpm.wpm.toFixed(2)}</dd>
          </React.Fragment>
        ))}
      </dl>
    );
  }

  private saveCommandResponseHistory(command: string, response: string, status: number): string {
    const commandTime = new Date();
    const timeCode = this.createTimeCode(commandTime).join(':');
    let commandText = this.createCommandRecord(command, commandTime);
    const commandElement = createHTMLElementFromHTML(commandText);
    let commandResponseElement = document.createElement('div');
    commandResponseElement.dataset.status = status.toString();
    commandResponseElement.appendChild(commandElement);
    commandResponseElement.appendChild(createHTMLElementFromHTML(`<div class="response">${response}</div>`));

    // Only keep the latest this.commandHistoryLimit number of commands
    const wpms = this.wpmCalculator.getWPMs();
    console.log("WPMs:", wpms);
    let wpmSum = this.wpmCalculator.saveKeystrokes(timeCode);
    this.wpmCalculator.clearKeystrokes();
    commandResponseElement.innerHTML = commandResponseElement.innerHTML.replace(/{{wpm}}/g, ('_____' + wpmSum.toFixed(0)).slice(-4));
    this._persistence.setItem(`${LogKeys.Command}_${timeCode}`, commandResponseElement.outerHTML);

    commandText = commandText.replace(/{{wpm}}/g, ('_____' + wpmSum.toFixed(0)).slice(-4));

    if (!this._commandHistory) { this._commandHistory = []; }
    const commandResponse = commandResponseElement.outerHTML;
    this._commandHistory.push(commandResponse);
    const wpmsHTML = this.WpmsToHTML(wpms.charWpms, "Lowest WPMs");
    this._commandHistory.push(wpmsHTML.toString());

    this.setState(prevState => ({ outputElements: [...prevState.outputElements, commandResponse] }));
    this.setState(prevState => ({ outputElements: [...prevState.outputElements, wpmsHTML] }));

    return commandResponse;

  }

  clearCommandHistory(): void {
    let keys: string[] = [];
    for (let i = localStorage.length; i >= 0; i--) {
      let key = localStorage.key(i);
      if (!key) continue;
      if (
        key.includes(LogKeys.Command)
        || key.includes('terminalCommandHistory') // Remove after clearing legacy phone db.
        || key.includes(LogKeys.CharTime)
      ) {
        keys.push(key);
      }
    }
    for (let key of keys) {
      localStorage.removeItem(key); // Clear localStorage.length
    }
    this._commandHistory = [];
  }


  public handleCharacter(character: string) {
    const charDuration: CharDuration = this.wpmCalculator.addKeystroke(character);
    const wpm = this.wpmCalculator.getWPM(charDuration);
    if(this.isDebug) console.log('wpm', wpm);
    if (character.charCodeAt(0) === 3) { // Ctrl+C
      console.log('Ctrl+C pressed');
      this.setState({ isInPhraseMode: false, commandLine: '' });
      this.adapterRef.current?.terminalReset();
      this.adapterRef.current?.prompt();

    }

    if (character.charCodeAt(0) === 4) { // Ctrl+D
      console.log('Ctrl+D pressed');

      // this.increaseFontSize();
    }

    if (character.charCodeAt(0) === 13) { // Enter key
      // Process the command before clearing the terminal
      // TODO: cancel timer
      if (this.nextCharsDisplayRef.current) this.nextCharsDisplayRef.current.cancelTimer();
      if (this.state.isInPhraseMode) {
        this.setState({ isInPhraseMode: false });

      }
      let command = this.adapterRef.current?.getCurrentCommand() ?? '';
      // Clear the terminal after processing the command
      this.terminalReset();
      // TODO: reset timer
      // Write the new prompt after clearing
      this.adapterRef.current?.prompt();
      if (command === '') return;
      if (command === 'clear') {
        // this.handexTerm.clearCommandHistory();
        this.setState({ outputElements: [], isInPhraseMode: false, commandLine: '' });
        return;
      }
      if (command === 'video') {
        this.adapterRef.current?.toggleVideo();
        this.handleCommand(command + ' --' + this.adapterRef.current?.isShowVideo);
        // TODO: handle toggle video 
        // this.outputElement.appendChild(result);

        return;
      }
      if (command.startsWith('debug')) {
        let isDebug = command.includes('--true') || command.includes('-t');
        this.toggleIsDebug(isDebug);
        return;
      }
      if (command === 'phrase' || command.startsWith('phrase ')) {
        // Start phrase mode
        console.log("phrase");
        this.setState({ isInPhraseMode: true });
      }
      // TODO: A bunch of phrase command stuff should be omoved from NextCharsDisplay to here, such as phrase generation.
      this.handleCommand(command);
    } else if (this.state.isInPhraseMode) {
      // # IN PHRASE MODE
      // this.handexTerm.handleCharacter(character);
      this.terminalWrite(character);
      let command = this.adapterRef.current?.getCurrentCommand() + character;

      if (command.length === 0) {
        if (this.nextCharsDisplayRef.current)
          this.nextCharsDisplayRef.current.resetTimer();
        return;
      }
      this.setState({ commandLine: command });
    } else {
      // For other input, just return it to the terminal.
      // this.handexTerm.handleCharacter(character);
      this.terminalWrite(character);
    }
    return charDuration.durationMilliseconds;
  }

  createCommandRecord(command: string, commandTime: Date): string {
    let commandText = `<div class="log-line"><span class="log-time">[${this.createTimeHTML(commandTime)}]</span><span class="wpm">{{wpm}}</span>${command}</div>`;
    return commandText;
  }

  private createTimeCode(now = new Date()): string[] {
    return now.toLocaleTimeString('en-US', { hour12: false }).split(':');
  }

  private createTimeHTML(time = new Date()): TimeHTML {
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');
    return `<span class="log-hour">${hours}</span><span class="log-minute">${minutes}</span><span class="log-second">${seconds}</span>`;
  }

  toggleIsDebug(setIsDebug: boolean | undefined) {
    this.isDebug = !this.isDebug;
    if (setIsDebug) {
      this.isDebug = setIsDebug;
    }
    localStorage.setItem('xterm-debug', String(this.isDebug));
    console.log('Xterm debug:', localStorage.getItem('xterm-debug'));
  }

  loadDebugValue() {
    if (localStorage.getItem('xterm-debug') === 'true') {
      this.isDebug = true;
    } else {
      this.isDebug = false;
    }
  }

  setNewPhrase(phrase: string) {
    // Write phrase to output.
    this.setState(prevState => ({ outputElements: [...prevState.outputElements, phrase] }));
  }

  handlePhraseSuccess(phrase: string, wpm: number) {
    console.log('XtermAdapter onPhraseSuccess', phrase, wpm);
    this.setState(prevState => ({ outputElements: [...prevState.outputElements, wpm.toString() + ":" + phrase] }));
    this.adapterRef.current?.prompt();
  }

  handleTimerStatusChange(isActive: boolean) {
    console.log('handleTimerStatusChange', isActive);
    this.setState({ isActive });
  }

  private terminalReset(): void {
    this.adapterRef.current?.terminalReset();
  }
  private terminalWrite(data: string): void {
    this.adapterRef.current?.terminalWrite(data);
  }

  private handleTouchStart: TouchEventHandler<HTMLDivElement> = (event: React.TouchEvent<HTMLDivElement>) => {
    this.adapterRef.current?.handleTouchStart(event);
  }

  private handleTouchEnd: TouchEventHandler<HTMLDivElement> = (event: React.TouchEvent<HTMLDivElement>) => {
    this.adapterRef.current?.handleTouchEnd(event);
  }

  private handleTouchMove: TouchEventHandler<HTMLDivElement> = (event: React.TouchEvent<HTMLDivElement>) => {
    this.adapterRef.current?.handleTouchMove(event);
  }

  public render() {
    return (
      <>
        <Output
          elements={this.state.outputElements}
          onTouchStart={this.handleTouchStart}
          onTouchEnd={this.handleTouchEnd}
          onTouchMove={this.handleTouchMove}
        />
        <NextCharsDisplay
          ref={this.nextCharsDisplayRef}
          onTimerStatusChange={this.handleTimerStatusChange}
          commandLine={this.state.commandLine}
          isInPhraseMode={this.state.isInPhraseMode}
          onNewPhrase={this.setNewPhrase}
          onPhraseSuccess={this.handlePhraseSuccess}
        />
        <XtermAdapter
          ref={this.adapterRef}
          terminalElement={this.terminalElementRef.current}
          terminalElementRef={this.terminalElementRef}
          onAddCharacter={this.handleCharacter.bind(this)}
          writeData={this.terminalWrite.bind(this)}
          resetTerminal={this.terminalReset.bind(this)}
        />
      </>
    )
  }
}