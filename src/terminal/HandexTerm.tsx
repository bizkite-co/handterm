// HandexTerm.ts
import { LogKeys, TimeHTML, CharDuration, CharWPM, TerminalCssClasses } from './TerminalTypes';
import { IWPMCalculator, WPMCalculator } from './WPMCalculator';
import { IPersistence, LocalStoragePersistence } from './Persistence';
import { createHTMLElementFromHTML } from '../utils/dom';
import React, { TouchEventHandler } from 'react';
import { XtermAdapter } from './XtermAdapter';
import { NextCharsDisplay } from '../NextCharsDisplay';
import { Output } from '../terminal/Output';
import { TerminalGame } from './game/TerminalGame';
import ReactDOMServer from 'react-dom/server';
import { ActionType } from './game/types/ActionTypes';


export interface IHandexTermProps {
  // Define the interface for your HandexTerm logic

}

export interface IHandexTermState {
  // Define the interface for your HandexTerm state
  outputElements: React.ReactNode[];
  isInPhraseMode: boolean;
  isActive: boolean;
  commandLine: string;
  heroAction: ActionType;
  zombie4Action: ActionType;
  terminalSize: { width: number; height: number } | undefined;
  terminalFontSize: number;
}


export class HandexTerm extends React.Component<IHandexTermProps, IHandexTermState> {
  // Implement the interface methods
  terminalElementRef = React.createRef<HTMLDivElement>();
  private adapterRef = React.createRef<XtermAdapter>();
  private nextCharsDisplayRef: React.RefObject<NextCharsDisplay> = React.createRef();
  private terminalGameRef = React.createRef<TerminalGame>();
  private _persistence: IPersistence;
  private _commandHistory: string[] = [];
  private wpmCalculator: IWPMCalculator = new WPMCalculator();
  private static readonly commandHistoryLimit = 100;
  private isDebug: boolean = false;
  canvasHeight: number = 100;
  private heroRunTimeoutId: number | null = null;
  private lastTouchDistance: number | null = null;
  private currentFontSize: number = 17;

  updateTerminalFontSize(newSize: number) {
    this.setState({ terminalFontSize: newSize });
  }

  constructor(IHandexTermProps: IHandexTermProps) {
    super(IHandexTermProps);
    this._persistence = new LocalStoragePersistence();
    this.state = {
      outputElements: this.getCommandHistory(),
      isInPhraseMode: false,
      isActive: false,
      commandLine: '',
      heroAction: 'Idle',
      zombie4Action: 'Walk',
      terminalSize: undefined,
      terminalFontSize: 17
    }
    this.loadDebugValue();
    this.loadFontSize();
  }

  componentWillUnmount(): void {
    if (this.heroRunTimeoutId) {
      clearTimeout(this.heroRunTimeoutId);
    }
    this.removeTouchListeners();
  }

  componentDidMount(): void {
    if (this.adapterRef.current) {
      const size = this.adapterRef.current.getTerminalSize();
      if (size) {
        this.setState({ terminalSize: size });
        console.log("didMount terminalSize", size);
      }
    }
    window.scrollTo(0, document.body.scrollHeight);

    this.addTouchListeners();
  }

  public handleCommand(command: string): string {
    let status = 404;
    let response = "Command not found.";
    if (this.state.isInPhraseMode) {
      response = "";
    }
    this.setState({ outputElements: [], isInPhraseMode: false, commandLine: '' });

    if (command === 'clear') {
      status = 200;
      this.clearCommandHistory();
      this.adapterRef.current?.prompt();
      return '';
    }
    if (command === 'kill') {
      if(!this.terminalGameRef.current) return '';
      this.terminalGameRef.current.setZombie4Action('Die');
      console.log("Set zombie4 action to die");
    }
    if (command === 'play') {
      status = 200;
      response = "Would you like to play a game?"
    }
    if (command === 'phrase' || command.startsWith('phrase ')) {
      status = 200;
      response = "Type the phrase as fast as you can."
      this.setState({ isInPhraseMode: true });
    }
    if (command.startsWith('video --')) {
      status = 200;
      if (command === 'video --true') {
        response = "Starting video camera..."
      }
      else {
        response = "Stopping video camera..."
      }
      this.adapterRef.current?.toggleVideo();
      this.handleCommand(command + ' --' + this.adapterRef.current?.isShowVideo);
      // TODO: handle toggle video 
      // this.outputElement.appendChild(result);

      return "video";
    }


    if (this.nextCharsDisplayRef.current) this.nextCharsDisplayRef.current.cancelTimer();
    if (this.state.isInPhraseMode) {
      this.setState({ isInPhraseMode: false });
    }
    // Clear the terminal after processing the command
    // TODO: reset timer
    // Write the new prompt after clearing
    this.adapterRef.current?.prompt();
    if (command === '') return "no-op";
    if (command.startsWith('debug')) {
      let isDebug = command.includes('--true') || command.includes('-t');
      this.toggleIsDebug(isDebug);
      return "debug";
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
      <table className="wpm-table">
        <tbody>
          <tr><th colSpan={2}>{name}</th></tr>
          {wpms.map((wpm, index) => (
            <React.Fragment key={index}>
              <tr id={name} className="wpm-table-row" >
                <td>{wpm.character
                  .replace("\r", "\\r")
                  .replace(" ", "\\s")
                }
                </td>
                <td className="number">{wpm.wpm.toFixed(2)}</td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    );
  }

  averageWpmByCharacter(charWpms: CharWPM[]): CharWPM[] {
    const charGroups: Record<string, { totalWpm: number, count: number }> = {};

    // Sum WPMs for each character and count occurrences
    charWpms.forEach(({ character, wpm }) => {
      if (!charGroups[character]) {
        charGroups[character] = { totalWpm: 0, count: 0 };
      }
      charGroups[character].totalWpm += wpm;
      charGroups[character].count++;
    });

    // Calculate average WPM for each character
    return Object.entries(charGroups).map(([character, { totalWpm, count }]) => ({
      character,
      wpm: totalWpm / count,
      durationMilliseconds: 0, // You may want to handle duration aggregation differently
    }));
  }

  private saveCommandResponseHistory(command: string, response: string, status: number): string {
    const commandTime = new Date();
    const timeCode = this.createTimeCode(commandTime).join(':');
    let commandText = this.createCommandRecord(command, commandTime);
    // TODO: Render this with JSX instead.
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

    commandText = commandText.replace(/{{wpm}}/g, ('_____' + wpmSum.toFixed(0)).slice(-4));

    if (!this._commandHistory) { this._commandHistory = []; }
    const commandResponse = commandResponseElement.outerHTML;
    this._commandHistory.push(commandResponse);
    const characterAverages = this.averageWpmByCharacter(wpms.charWpms.filter(wpm => wpm.durationMilliseconds > 1));
    const slowestCharacters = this.WpmsToHTML(characterAverages.sort((a, b) => a.wpm - b.wpm).slice(0, 3), "slow-chars");
    this._commandHistory.push(slowestCharacters.toString());

    this.setState(prevState => ({ outputElements: [...prevState.outputElements, commandResponse] }));
    this.setState(prevState => ({ outputElements: [...prevState.outputElements, slowestCharacters] }));

    const slowestCharactersHTML = ReactDOMServer.renderToStaticMarkup(slowestCharacters);

    // Now you can append slowestCharactersHTML as a string to your element's innerHTML
    commandResponseElement.innerHTML += slowestCharactersHTML;
    this._persistence.setItem(`${LogKeys.Command}_${timeCode}`, commandResponseElement.outerHTML);

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

  public handleCharacter = (character: string) => {
    const charDuration: CharDuration = this.wpmCalculator.addKeystroke(character);
    const wpm = this.wpmCalculator.getWPM(charDuration);
    if (this.isDebug) console.log('wpm', wpm);
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
      let command = this.adapterRef.current?.getCurrentCommand() ?? '';
      this.terminalReset();
      this.handleCommand(command);
      // TODO: A bunch of phrase command stuff should be moved from NextCharsDisplay to here, such as phrase generation.
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
      this.setHeroRunAction();
    } else {
      // For other input, just return it to the terminal.
      // this.handexTerm.handleCharacter(character);
      this.terminalWrite(character);
      this.setHeroRunAction();
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

  setNewPhrase = (phrase: string) => {
    // Write phrase to output.
    this.setState(prevState => ({ outputElements: [...prevState.outputElements, phrase] }));
  }

  handlePhraseSuccess = (phrase: string, wpm: number) => {
    console.log('XtermAdapter onPhraseSuccess', phrase, wpm);
    this.setState(prevState => ({ outputElements: [...prevState.outputElements, wpm.toString() + ":" + phrase] }));
    this.setZombie4Action('Die');
    console.log('XtermAdapter onPhraseSuccess, setZombie4Action Die', phrase, wpm);
    this.adapterRef.current?.prompt();
  }

  setHeroRunAction = () => {
    // Clear any existing timeout to reset the timer
    if (this.heroRunTimeoutId) {
      clearTimeout(this.heroRunTimeoutId);
      this.heroRunTimeoutId = null;
    }

    // Set the hero to run
    this.setState({ heroAction: 'Run' });

    // Set a timeout to stop the hero from running after 1000ms
    this.heroRunTimeoutId = window.setTimeout(() => {
      this.setState({ heroAction: 'Idle' });
      this.heroRunTimeoutId = null; // Clear the timeout ID
    }, 1000);
  }

  setHeroAction = (newAction: ActionType) => {
    this.setState({ heroAction: newAction });
  }

  setZombie4Action = (newAction: ActionType) => {
    this.setState({ zombie4Action: newAction });
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

  private loadFontSize(): void {
    let getFontSize: string = localStorage.getItem('terminalFontSize') || this.currentFontSize.toString();
    const fontSize = (getFontSize && getFontSize == 'NaN') ? this.currentFontSize : parseInt(getFontSize);

    console.log("loadFontSize", fontSize);
    if (fontSize) {
      this.currentFontSize = fontSize;
      document.documentElement.style.setProperty('--terminal-font-size', `${this.currentFontSize}px`);
      // if (this.terminalElement) {

      //   this.terminalElement.style.fontSize = `${this.currentFontSize}px`;
      // } else {
      //   console.error('XtermAdapter - terminalElement is NULL');
      // }
      // this.terminal.options.fontSize = this.currentFontSize;
    }
  }
  public handleTouchStart: TouchEventHandler<HTMLDivElement> = (event: React.TouchEvent<HTMLDivElement>) => {
    setTimeout(() => {
      // this.terminalElement.focus();
    }, 500)
    if (event.touches.length === 2) {

      // event.preventDefault();
      this.lastTouchDistance = this.getDistanceBetweenTouches(event.touches as unknown as TouchList);
    }
  }

  public handleTouchMove = (event: TouchEvent) => {
    if (event.touches.length === 2) {
      event.preventDefault();
      const currentDistance = this.getDistanceBetweenTouches(event.touches);
      if (this.lastTouchDistance) {
        const scaleFactor = currentDistance / this.lastTouchDistance;
        this.currentFontSize *= scaleFactor;
        console.log('currentFontSize', this.currentFontSize);
        // TODO: Figure out how to resize fonts now with REact.
        document.documentElement.style.setProperty('--terminal-font-size', `${this.currentFontSize}pt`);
        this.lastTouchDistance = currentDistance;
        // this.terminal.options.fontSize = this.currentFontSize;
        // this.terminal.refresh(0, this.terminal.rows - 1); // Refresh the terminal display
      }
    }
  }

  public increaseFontSize() {
    this.currentFontSize += 1;
    // this.terminal.options.fontSize = this.currentFontSize;
    // this.terminal.refresh(0, this.terminal.rows - 1);
    localStorage.setItem('terminalFontSize', `${this.currentFontSize}`);
  }

  public handleTouchEnd: TouchEventHandler<HTMLDivElement> = () => {
    localStorage.setItem('terminalFontSize', `${this.currentFontSize}`);
    console.log('SET terminalFontSize', this.currentFontSize);
    this.lastTouchDistance = null;
  }

  addTouchListeners() {
    // Assuming 'terminalElementRef' points to the div you want to attach the event
    const div = this.terminalElementRef.current;
    if (div) {
      div.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    }
    const output = window.document.getElementById(TerminalCssClasses.Output);
    if (output) {
      output.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    }
    const terminal = document.getElementById(TerminalCssClasses.Terminal);
    if (terminal) {
      terminal.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    }
  }

  removeTouchListeners() {
    const div = this.terminalElementRef.current;
    if (div) {
      div.removeEventListener('touchmove', this.handleTouchMove);
    }
    const output = window.document.getElementById(TerminalCssClasses.Output);
    if (output) {
      output.removeEventListener('touchmove', this.handleTouchMove);
    }
    const terminal = document.getElementById(TerminalCssClasses.Terminal);
    if (terminal) {
      terminal.removeEventListener('touchmove', this.handleTouchMove);
    }
  }

  private getDistanceBetweenTouches(touches: TouchList): number {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.pageX - touch1.pageX, 2) +
      Math.pow(touch2.pageY - touch1.pageY, 2),
    );
  }

  public render() {
    const { terminalSize } = this.state;
    const canvasWidth = terminalSize ? terminalSize.width : 800;
    // canvas height does not need to match terminal height

    return (
      <div className="terminal-container">
        <Output
          elements={this.state.outputElements}
          onTouchStart={this.handleTouchStart}
          onTouchEnd={this.handleTouchEnd}
        />
        <TerminalGame
          ref={this.terminalGameRef}
          canvasHeight={this.canvasHeight}
          canvasWidth={canvasWidth} // Use the width from terminalSize if available
          isInPhraseMode={this.state.isInPhraseMode}
          heroAction={this.state.heroAction}
          zombie4Action={this.state.zombie4Action}
          onTouchStart={this.handleTouchStart}
          onTouchEnd={this.handleTouchEnd}
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
          terminalFontSize={this.currentFontSize}
          onAddCharacter={this.handleCharacter}
          onTouchStart={this.handleTouchStart}
          onTouchEnd={this.handleTouchEnd}
        />
      </div>
    )
  }
}