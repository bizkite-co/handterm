// HandexTerm.ts
import { LogKeys, TimeHTML, CharDuration, CharWPM, TerminalCssClasses } from '../types/TerminalTypes';
import { IWPMCalculator, WPMCalculator } from '../utils/WPMCalculator';
import { IPersistence, LocalStoragePersistence } from '../Persistence';
import { createHTMLElementFromHTML } from '../utils/dom';
import React, { ContextType, TouchEventHandler } from 'react';
import { XtermAdapter } from './XtermAdapter';
import { NextCharsDisplay } from './NextCharsDisplay';
import { Output } from './Output';
import { TerminalGame } from '../game/TerminalGame';
import ReactDOMServer from 'react-dom/server';
import { ActionType } from '../game/types/ActionTypes';
import Phrases from '../utils/Phrases';
import { IWebCam, WebCam } from '../utils/WebCam';
import { getLevelCount } from '../game/Level';
import { CommandContext } from '../commands/CommandContext';

export interface IHandexTermProps {
  // Define the interface for your HandexTerm logic
  terminalWidth: number;
}

export interface IHandexTermState {
  // Define the interface for your HandexTerm state
  outputElements: React.ReactNode[];
  isInPhraseMode: boolean;
  phrase: string;
  isActive: boolean;
  commandLine: string;
  heroAction: ActionType;
  zombie4Action: ActionType;
  terminalSize: { width: number; height: number } | undefined;
  terminalFontSize: number;
  canvasHeight: number;
}


class HandexTerm extends React.Component<IHandexTermProps, IHandexTermState> {
 // Declare the context property with the type of your CommandContext
  static contextType = CommandContext;
  // TypeScript will now understand that this.context is of the type of your CommandContext
  declare context: ContextType<typeof CommandContext>;
  // Implement the interface methods
  private terminalElementRef = React.createRef<HTMLDivElement>();
  public adapterRef = React.createRef<XtermAdapter>();
  private nextCharsDisplayRef: React.RefObject<NextCharsDisplay> = React.createRef();
  private terminalGameRef = React.createRef<TerminalGame>();
  private _persistence: IPersistence;
  private _commandHistory: string[] = [];
  private wpmCalculator: IWPMCalculator = new WPMCalculator();
  private videoElementRef: React.RefObject<HTMLVideoElement> = React.createRef();
  private webCam: IWebCam | null = null;
  private static readonly commandHistoryLimit = 120;
  private isDebug: boolean = false;
  private heroRunTimeoutId: number | null = null;
  private heroSummersaultTimeoutId: number | null = null;
  private lastTouchDistance: number | null = null;
  private currentFontSize: number = 17;
  isShowVideo: any;

  updateTerminalFontSize(newSize: number) {
    this.setState({ terminalFontSize: newSize });
  }

  public focusTerminal() {
    if (this.adapterRef.current) {
      this.adapterRef.current.focusTerminal();
    }
  }

  constructor(IHandexTermProps: IHandexTermProps) {
    super(IHandexTermProps);
    this._persistence = new LocalStoragePersistence();
    const initialCanvasHeight = localStorage.getItem('canvasHeight') || '100';
    this.state = {
      outputElements: this.getCommandHistory(),
      isInPhraseMode: false,
      phrase: '', // Initial value
      isActive: false,
      commandLine: '',
      heroAction: 'Idle',
      zombie4Action: 'Walk',
      terminalSize: undefined,
      terminalFontSize: 17,
      canvasHeight: parseInt(initialCanvasHeight),
    }
    this.loadDebugValue();
    this.loadFontSize();
  }

  componentDidMount(): void {
    if (this.adapterRef.current) {
      const size = this.adapterRef.current.getTerminalSize();
      if (size) {
        this.setState({ terminalSize: size });
      }
    }
    window.scrollTo(0, document.body.scrollHeight);

    if (this.videoElementRef.current) {
      this.webCam = new WebCam(this.videoElementRef.current);
    }

    this.addTouchListeners();
  }

  componentWillUnmount(): void {
    if (this.heroRunTimeoutId) {
      clearTimeout(this.heroRunTimeoutId);
    }
    this.removeTouchListeners();
  }

  handlePhraseComplete = () => {
    this.setState({
      isInPhraseMode: false,
      phrase: ''
    });
  }

  public handleCommand = (command: string) => {
    if(this.context) {
      const output = this.context.executeCommand(command);
      console.log('Command output', output);
    }

    let status = 404;
    let response = "Command not found.";
    this.terminalGameRef.current?.resetGame();
    window.scrollTo(0, document.body.scrollHeight);
    if (this.state.isInPhraseMode) {
      response = "";
    }
    this.setState({ outputElements: [], isInPhraseMode: false, commandLine: '' });

    if (command === 'clear') {
      status = 200;
      this.clearCommandHistory();
      this.adapterRef.current?.prompt();
      return;
    }
    if (command === 'kill') {
      if (!this.terminalGameRef.current) return;
      this.terminalGameRef.current.setZombie4ToDeathThenResetPosition();
      this.terminalGameRef.current.completeGame();
    }
    if (command === 'ls phrases') {
      status = 200;
      const phrases = Phrases.getPhrases();
      response = '<div class="phrase-names"><div class="phrase-name">'
        + phrases.join('</div><div class="phrase-name">') +
        '</div></div>';
      // return response;
    }
    if (command.startsWith('level')) {

      if (!this.terminalGameRef.current) return;
      let nextLevel = this.terminalGameRef.current.getLevel() + 1;
      const matchResult = command.match(/\d+/g);
      if (matchResult) {
        nextLevel = parseInt(matchResult[0] ?? '1');
        if (nextLevel > getLevelCount()) nextLevel = getLevelCount();
      }
      if (nextLevel > getLevelCount()) nextLevel = 1;
      if (nextLevel < 1) nextLevel = 1;
      console.log("nextLevel", nextLevel);
      this.terminalGameRef.current?.setLevel(nextLevel);
    }
    if (command === 'play') {
      status = 200;
      response = "Would you like to play a game?"
    }
    if (command === 'phrase' || command.startsWith('phrase ')) {
      status = 200;
      response = "Type the phrase as fast as you can."
      this.setNewPhrase(command);
    }
    if (command.startsWith('video')) {
      status = 200;
      const isOn = this.toggleVideo();
      if (isOn) {
        response = "Starting video camera..."
      }
      else {
        response = "Stopping video camera..."
      }
      // this.handleCommand(command + ' --' + this.adapterRef.current?.isShowVideo);
    }

    if (this.nextCharsDisplayRef.current) this.nextCharsDisplayRef.current.cancelTimer();
    if (this.state.isInPhraseMode) {
      this.setState({ isInPhraseMode: false });
    }
    // Clear the terminal after processing the command
    // TODO: reset timer
    // Write the new prompt after clearing
    this.adapterRef.current?.prompt();
    if (command === '') return;
    if (command.startsWith('debug')) {
      let isDebug = command.includes('--true') || command.includes('-t');
      this.toggleIsDebug(isDebug);
      return;
    }

    // Truncate the history if it's too long before saving
    if (this._commandHistory.length > HandexTerm.commandHistoryLimit) {
      this._commandHistory.shift(); // Remove the oldest command
    }
    this.saveCommandResponseHistory(command, response, status); // Save updated history to localStorage
    return ;
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
      this.increaseFontSize();
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
      this.terminalWrite(character);
      let command = this.adapterRef.current?.getCurrentCommand() + character;

      if (command.length === 0) {
        if (this.nextCharsDisplayRef.current)
          this.nextCharsDisplayRef.current.resetTimer();
        return;
      }

      const nextChars = this.nextCharsDisplayRef.current?.getNextCharacters(command) ?? '';
      this.setState({
        commandLine: command,
        phrase: nextChars,
      });
      if ([',', '.', '!', '?'].includes(character) || /[0-9]/.test(character)) {
        this.setHeroSummersaultAction();
        console.log('Set hero to summersault');
      }
      else {
        this.setHeroRunAction();
      }
    } else {
      // For other input, just return it to the terminal.
      this.terminalWrite(character);
      if ([',', '.', '!', '?'].includes(character) || /[0-9]/.test(character)) {
        this.setHeroSummersaultAction();
        console.log('Set hero to summersault');
      }
      else {
        this.setHeroRunAction();
      }
    }
    return charDuration.durationMilliseconds;
  }

  setNewPhrase = (phraseName: string) => {
    phraseName = phraseName.replace('phrase ', '');
    const newPhrase
      = phraseName && phraseName != "" && Phrases.getPhrase(phraseName)
        ? Phrases.getPhrase(phraseName)
        : Phrases.getRandomPhrase();

    // this.phrase = new Phrase(newPhrase);
    this.setState({
      isInPhraseMode: true,
      phrase: newPhrase,
    });

    // this.props.onNewPhrase(newPhrase); 
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

  handlePhraseSuccess = (phrase: string, wpm: number) => {
    this.setState(
      prevState => ({
        outputElements: [
          ...prevState.outputElements,
          wpm.toString() + ":" + phrase
        ]
      })
    );

    this.terminalGameRef.current?.completeGame();
    // this.adapterRef.current?.prompt();
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

    }, 800);
  }

  setHeroSummersaultAction = () => {
    // Clear any existing timeout to reset the timer
    if (this.heroSummersaultTimeoutId) {
      clearTimeout(this.heroSummersaultTimeoutId);
      this.heroSummersaultTimeoutId = null;
    }

    // Set the hero to run
    this.setState({ heroAction: 'Summersault' });
    // Set a timeout to stop the hero from running after 1000ms
    this.heroSummersaultTimeoutId = window.setTimeout(() => {
      this.setState({ heroAction: 'Idle' });
      this.heroSummersaultTimeoutId = null; // Clear the timeout ID

    }, 800);
  }

  setHeroAction = (newAction: ActionType) => {
    this.setState({ heroAction: newAction });
  }

  setZombie4Action = (newAction: ActionType) => {
    this.setState({ zombie4Action: newAction });
  }

  handleTimerStatusChange(isActive: boolean) {
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

  public handleTouchStart: TouchEventHandler<HTMLElement> = (event: React.TouchEvent<HTMLElement>) => {
    setTimeout(() => {
      // this.terminalElement.focus();
    }, 500)
    if (event.touches.length === 2) {

      // event.preventDefault();
      this.lastTouchDistance = this.getDistanceBetweenTouches(event.touches as unknown as TouchList);
    }
  }

  // private handleTouchStart = (event: TouchEvent) => {
  //   setTimeout(() => {
  //     // this.terminalElement.focus();
  //   }, 500);

  //   if (event.touches.length === 2) {
  //     // event.preventDefault();
  //     const touchList = event.touches as unknown as TouchList;
  //     this.lastTouchDistance = this.getDistanceBetweenTouches(touchList);
  //   }
  // };

  public handleTouchMove = (event: TouchEvent) => {
    if (event.touches.length === 2) {
      event.preventDefault();

      const currentDistance = this.getDistanceBetweenTouches(event.touches);
      if (this.lastTouchDistance && this.lastTouchDistance > 0) {
        const eventTarget = event.target as HTMLElement;
        const scaleFactor = currentDistance / this.lastTouchDistance;
        if (eventTarget && eventTarget.nodeName === 'CANVAS') {
          this.setState((prevState) => {
            return {
              canvasHeight: prevState.canvasHeight * scaleFactor
            }
          })
          console.log('canvasHeight', this.state.canvasHeight);
          return;
        }
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
    console.log('INCREASE terminalFontSize', this.currentFontSize);
  }

  public handleTouchEnd: TouchEventHandler<HTMLDivElement> = () => {
    localStorage.setItem('terminalFontSize', `${this.currentFontSize}`);
    console.log('SET terminalFontSize', this.currentFontSize);
    this.lastTouchDistance = null;
  }

  addTouchListeners() {
    // Assuming 'terminalElementRef' points to the div you want to attach the event
    const output = window.document.getElementById(TerminalCssClasses.Output);
    if (output) {
      output.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    }
    const terminal = document.getElementById(TerminalCssClasses.Terminal);
    if (terminal) {
      terminal.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    }
    const game = window.document.getElementById(TerminalCssClasses.TerminalGame);
    if (game) {
      // game.addEventListener('touchstart', this.handleTouchStart );
      game.addEventListener('touchmove', this.handleTouchMove, { passive: false });
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
    const game = window.document.getElementById(TerminalCssClasses.TerminalGame);
    if (game) {
      game.removeEventListener('touchmove', this.handleTouchMove);
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


  public toggleVideo = (): boolean => {
    this.isShowVideo = !this.isShowVideo;
    this.webCam?.toggleVideo(this.isShowVideo);
    return this.isShowVideo;
  }

  public render() {
    const { terminalSize } = this.state;
    const canvasWidth = terminalSize ? terminalSize.width : 800;
    // canvas height does not need to match terminal height

    return (
      <CommandContext.Consumer>
        {(context) => {
          this.context = context;

          return (
            <div className="terminal-container">
              <Output
                elements={this.state.outputElements}
                onTouchStart={this.handleTouchStart}
                onTouchEnd={this.handleTouchEnd}
              />
              <TerminalGame
                ref={this.terminalGameRef}
                canvasHeight={this.state.canvasHeight}
                canvasWidth={canvasWidth} // Use the width from terminalSize if available
                isInPhraseMode={this.state.isInPhraseMode}
                heroActionType={this.state.heroAction}
                zombie4ActionType={this.state.zombie4Action}
                onTouchStart={this.handleTouchStart}
                onTouchEnd={this.handleTouchEnd}
              />
              <NextCharsDisplay
                ref={this.nextCharsDisplayRef}
                onTimerStatusChange={this.handleTimerStatusChange}
                commandLine={this.state.commandLine}
                isInPhraseMode={this.state.isInPhraseMode}
                newPhrase={this.state.phrase}
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
              <video
                ref={this.videoElementRef as React.RefObject<HTMLVideoElement>}
                id="terminal-video"
                hidden={!this.isShowVideo}
              ></video>
            </div>

          );
        }}
      </CommandContext.Consumer>
    )
  }
}

HandexTerm.contextType = CommandContext;

export default HandexTerm;