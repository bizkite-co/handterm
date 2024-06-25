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
import { CommandContext } from '../commands/CommandContext';
import { Achievement, Achievements } from '../types/Types';
import { TutorialComponent } from './TutorialComponent';
import { ChordDisplay } from './ChordDisplay';


export interface IHandTermProps {
  // Define the interface for your HandexTerm logic
  terminalWidth: number;
}

export interface IHandTermState {
  // Define the interface for your HandexTerm state
  outputElements: React.ReactNode[];
  isInPhraseMode: boolean;
  phrase: string;
  phraseIndex: number;
  isActive: boolean;
  commandLine: string;
  heroAction: ActionType;
  zombie4Action: ActionType;
  terminalSize: { width: number; height: number } | undefined;
  terminalFontSize: number;
  canvasHeight: number;
  unlockedAchievements: string[];
  nextAchievement: Achievement | null;
  isInTutorial: boolean;
  commandHistory: string[];
  currentCommandIndex: number;
}

class HandTerm extends React.Component<IHandTermProps, IHandTermState> {
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
  outputRef = React.createRef<HTMLDivElement>();

  loadAchievements(): string[] {
    const storedAchievements = localStorage.getItem('achievements');
    return storedAchievements ? JSON.parse(storedAchievements) : [];
  }

  saveAchievements(achievementPhrase: string) {
    const storedAchievementString: string = localStorage.getItem('achievements') || '';
    let storedAchievements = storedAchievementString ? JSON.parse(storedAchievementString) : [];
    storedAchievements.push(achievementPhrase);
    localStorage.setItem('achievements', JSON.stringify(storedAchievements));
  }

  getNextAchievement(): Achievement | null {
    const unlockedAchievements = this.loadAchievements() || [];
    const nextAchievement = Achievements.find(a => !unlockedAchievements.some(ua => ua === a.phrase.join('')));
    return nextAchievement || null;
  }

  public focusTerminal() {
    if (this.adapterRef.current) {
      this.adapterRef.current.focusTerminal();
    }
  }

  constructor(IHandexTermProps: IHandTermProps) {
    super(IHandexTermProps);
    this._persistence = new LocalStoragePersistence();
    const initialCanvasHeight = localStorage.getItem('canvasHeight') || '100';
    const nextAchievement = this.getNextAchievement();
    this.state = {
      outputElements: this.getCommandResponseHistory().slice(-1),
      isInPhraseMode: false,
      phrase: '', // Initial value
      phraseIndex: 0,
      isActive: false,
      commandLine: '',
      heroAction: 'Idle',
      zombie4Action: 'Walk',
      terminalSize: undefined,
      terminalFontSize: 17,
      canvasHeight: parseInt(initialCanvasHeight),
      unlockedAchievements: this.loadAchievements(),
      nextAchievement: nextAchievement,
      isInTutorial: true,
      commandHistory: this.loadCommandHistory(),
      currentCommandIndex: -1,
    }
    this.loadDebugValue();
    this.loadFontSize();
  }

  componentDidUpdate(_prevProps: Readonly<IHandTermProps>, _prevState: Readonly<IHandTermState>, _snapshot?: any): void {

  }

  loadCommandHistory() {
    return JSON.parse(localStorage.getItem('commandHistory') || '[]');
  }
  saveCommandHistory(commandHistory: any) {
    localStorage.setItem('commandHistory', JSON.stringify(commandHistory));
  }

  scrollToBottom() {
    if (this.adapterRef.current) {
      this.adapterRef.current.scrollBottom();
    }
  }

  componentDidMount(): void {
    if (this.adapterRef.current) {
      const size = this.adapterRef.current.getTerminalSize();
      if (size) {
        this.setState({ terminalSize: size });
      }
    }
    this.scrollToBottom();

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

  public handleCommand = (cmd: string) => {
    this.setState(
      // Update the command history
      prevState => ({
        commandHistory: [cmd, ...prevState.commandHistory],
        currentCommandIndex: -1,
      }),
      () => this.saveCommandHistory(this.state.commandHistory)
    );
    // TODO: handle achievement unlocks
    if (this.state.isInTutorial) {
      // Unlock the next achievement and decide if we are still in tutorial mode
      if (cmd === '') cmd = 'Return (ENTER)';
      if (this.state.nextAchievement?.phrase.join('') === cmd
      ) {
        this.unlockAchievement(cmd);
      }
    }
    const {command, args, switches} = this.parseCommand(cmd);
    if (this.context) {
      const output = this.context
        .executeCommand(
          command,
          args,
          switches,
        );
      if (output.status === 200) return;
    }
    let status = 404;
    let response = "Command not found.";
    this.terminalGameRef.current?.resetGame();
    this.scrollToBottom();
    if (this.state.isInPhraseMode) {
      response = "";
    }
    this.setState({ isInPhraseMode: false, commandLine: '' });

    if (command === 'help' || command === '411') {
      status = 200;
      const commandChords = ['UpArrow', 'LeftArrow', 'DownArrow', 'RightArrow'].map(c => {
        return <ChordDisplay displayChar={[c]} />
      });
      const commandChordsHtml = commandChords.map(element => {
        return ReactDOMServer.renderToStaticMarkup(element);
      }).join('');
      response = "<div class='chord-display-container'>" + commandChordsHtml + "</div>";
    }

    if (command === 'kill') {
      if (!this.terminalGameRef.current) return;
      this.terminalGameRef.current.setZombie4ToDeathThenResetPosition();
      this.terminalGameRef.current.completeGame();
      response = "Killed zombie 4. Reset position and game completed.";
      status = 200;
    }

    if (command.startsWith('level')) {
      if (!this.terminalGameRef.current) return;
      let levelNum = command.match(/\d+/);
      const level = levelNum && levelNum.length ? parseInt(levelNum[0]) : null;
      this.terminalGameRef.current?.levelUp(level);
    }

    if (command === 'play' || command.startsWith('play ')) {
      status = 200;
      response = "Type the phrase as fast as you can."
      this.setNewPhrase(command);
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
    if (this._commandHistory.length > HandTerm.commandHistoryLimit) {
      this._commandHistory.shift(); // Remove the oldest command
    }
    this.saveCommandResponseHistory(command, response, status); // Save updated history to localStorage
    return;
  }

  public handleCharacter = (character: string) => {
    const charDuration: CharDuration = this.wpmCalculator.addKeystroke(character);
    if (character.charCodeAt(0) === 3) { // Ctrl+C
      this.setState({ isInPhraseMode: false, commandLine: '' });
      this.adapterRef.current?.terminalReset();
      this.adapterRef.current?.prompt();
    }
    if (character === 'ArrowUp') {
      let newCommandIndex = (this.state.currentCommandIndex + 1) % this.state.commandHistory.length;
      let command = this.state.commandHistory[newCommandIndex];
      const commandResponseHistory = this.getCommandResponseHistory().reverse();
      this.setState({
        currentCommandIndex: newCommandIndex,
        commandLine: command,
        outputElements: [commandResponseHistory[newCommandIndex]],
      });

      this.terminalReset();
      this.terminalPrompt();
      this.terminalWrite(command);
      return;
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
    } else if (this.state.isInPhraseMode) {
      // # IN PHRASE MODE
      this.terminalWrite(character);
      let command = this.adapterRef.current?.getCurrentCommand() + character;

      if (command.length === 0) {
        if (this.nextCharsDisplayRef.current)
          this.nextCharsDisplayRef.current.resetTimer();
        return;
      }

      this.setState({
        commandLine: command,
      });
      if ([',', '.', '!', '?'].includes(character) || /[0-9]/.test(character)) {
        this.setHeroSummersaultAction();
      }
      else {
        this.setHeroRunAction();
      }
    } else {
      // For other input, just return it to the terminal.
      this.terminalWrite(character);
      if ([',', '.', '!', '?'].includes(character) || /[0-9]/.test(character)) {
        this.setHeroSummersaultAction();
      }
      else {
        this.setHeroRunAction();
      }
    }
    return charDuration.durationMilliseconds;
  }

  unlockAchievement = (phrase: string) => {
    this.setState(prevState => {
      const unlockedAchievements = prevState.unlockedAchievements;
      if (this.state.nextAchievement?.phrase.join('') === phrase) {
        this.saveAchievements(phrase);
      }
      const nextAchievement = this.getNextAchievement();
      return {
        ...prevState,
        achievements: unlockedAchievements,
        nextAchievement: nextAchievement,
        isInTutorial: nextAchievement ? true : false
      };
    });
  };

  private parseCommand(input: string): { command: string, args: string[], switches: Record<string, boolean> } {
    const parts = input.split(/\s+/); // Split by whitespace
    const command = parts.shift(); // The first element is the command
    const args = [];
    const switches: Record<string, boolean> = {};

    if (command) {
      for (const part of parts) {
        if (part.startsWith('--')) {
          // It's a switch, remove the '--' and set it to true in the switches object
          const switchName = part.substring(2);
          switches[switchName] = true;
        } else {
          // It's an argument
          args.push(part);
        }
      }
    }

    return { command: command || '', args, switches };
  }

  getCommandResponseHistory(): string[] {
    let keys: string[] = [];
    let commandHistory: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      if (!localStorage.key(i)?.startsWith(LogKeys.Command + '_')) continue;

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

  public saveCommandResponseHistory(command: string, response: string, status: number): string {
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
    const characterAverages = this.averageWpmByCharacter(wpms.charWpms.filter(wpm => wpm.durationMilliseconds > 1));
    const slowestCharacters = this.WpmsToHTML(characterAverages.sort((a, b) => a.wpm - b.wpm).slice(0, 3), "slow-chars");

    const slowestCharactersHTML = ReactDOMServer.renderToStaticMarkup(slowestCharacters);

    commandResponseElement.innerHTML += slowestCharactersHTML;
    this.writeOutput(commandResponse)

    // Now you can append slowestCharactersHTML as a string to your element's innerHTML
    this._persistence.setItem(`${LogKeys.Command}_${timeCode}`, commandResponseElement.outerHTML);

    return commandResponse;
  }

  writeOutput(output: string) {
    this._commandHistory = [output];
    this.setState({ outputElements: [output] });
  }

  clearCommandHistory(_command: string, args: string[] = [], _switches: Record<string, boolean | string> = {}): void {
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
      if (args.includes("achievements")) {
        if (key.includes('achievements')) {
          keys.push(key);
        }
      }
    }
    for (let key of keys) {
      localStorage.removeItem(key); // Clear localStorage.length
    }
    this._commandHistory = [];
    this.setState({ outputElements: [] });
    this.adapterRef.current?.terminalReset();
    this.adapterRef.current?.prompt();
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

  handlePhraseSuccess = (phrase: string) => {
    let wpmPhrase = this.wpmCalculator
      .getWPMs().wpmAverage.toString(10)
      + ':' + phrase;
    this.setState(
      prevState => ({
        outputElements: [
          ...prevState.outputElements,
          wpmPhrase
        ]
      })
    );
    this.saveCommandResponseHistory("game", wpmPhrase, 200);

    this.terminalGameRef.current?.completeGame();
    this.adapterRef.current?.terminalReset();
    this.adapterRef.current?.prompt();
    this.terminalGameRef.current?.levelUp();
    this.handlePhraseComplete();
  }

  handlePhraseComplete = () => {

    let newPhraseIndex = (this.state.phraseIndex + 1) % Phrases.phrases.length;
    let newPhrase = Phrases.getPhraseByIndex(newPhraseIndex);
    this.setState({
      phraseIndex: newPhraseIndex,
      isInPhraseMode: true,
      phrase: newPhrase
    });
    this.terminalGameRef.current?.completeGame();
  }

  setNewPhrase = (phraseName: string) => {
    phraseName = phraseName.replace('phrase ', '');

    const newPhrase
      = phraseName && phraseName != "" && Phrases.getPhrase(phraseName)
        ? Phrases.getPhrase(phraseName)
        : Phrases.getPhraseByIndex(this.state.phraseIndex);

    // this.phrase = new Phrase(newPhrase);
    this.setState((prevState) => {
      return {
        ...prevState,
        isInPhraseMode: true,
        phrase: newPhrase,
        commandLine: newPhrase
      }
    });
    // this.props.onNewPhrase(newPhrase); 
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

  private terminalPrompt(): void {
    this.adapterRef.current?.prompt();
  }

  private terminalWrite(data: string): void {
    this.adapterRef.current?.terminalWrite(data);
  }

  private loadFontSize(): void {
    let getFontSize: string = localStorage.getItem('terminalFontSize') || this.currentFontSize.toString();
    const fontSize = (getFontSize && getFontSize == 'NaN') ? this.currentFontSize : parseInt(getFontSize);

    if (fontSize) {
      this.currentFontSize = fontSize;
      document.documentElement.style.setProperty('--terminal-font-size', `${this.currentFontSize}px`);
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
          return;
        }
        this.currentFontSize *= scaleFactor;
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
                ref={this.outputRef}
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
                onSetHeroAction={this.setHeroAction}
                onSetZombie4Action={this.setZombie4Action}
                onTouchStart={this.handleTouchStart}
                onTouchEnd={this.handleTouchEnd}
              />
              {this.state.isInPhraseMode
                && this.state.phrase
                && <NextCharsDisplay
                  ref={this.nextCharsDisplayRef}
                  onTimerStatusChange={this.handleTimerStatusChange}
                  commandLine={this.state.commandLine}
                  isInPhraseMode={this.state.isInPhraseMode}
                  newPhrase={this.state.phrase}
                  onPhraseSuccess={this.handlePhraseSuccess}
                />
              }
              {Array.isArray(this.state.nextAchievement?.phrase)
                && TutorialComponent
                && <TutorialComponent
                  achievement={this.state.nextAchievement}
                  isInTutorial={this.state.isInTutorial}
                  includeReturn={true}
                />
              }
              <XtermAdapter
                ref={this.adapterRef}
                terminalElement={this.terminalElementRef.current}
                terminalElementRef={this.terminalElementRef}
                terminalFontSize={this.currentFontSize}
                onAddCharacter={this.handleCharacter}
                onTouchStart={this.handleTouchStart}
                onTouchEnd={this.handleTouchEnd}
              />
              {/* TODO: Move this into JSX in the WebCam component */}
              <video
                ref={this.videoElementRef as React.RefObject<HTMLVideoElement>}
                id="terminal-video"
                hidden={!this.isShowVideo}
              >
              </video>
            </div>
          );
        }}
      </CommandContext.Consumer>
    )
  }
}

HandTerm.contextType = CommandContext;
export default HandTerm;