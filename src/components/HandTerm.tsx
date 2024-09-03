import { LogKeys, TimeHTML, CharDuration, CharWPM, TerminalCssClasses } from '../types/TerminalTypes';
import { IWPMCalculator, WPMCalculator } from '../utils/WPMCalculator';
import { IPersistence, LocalStoragePersistence } from '../Persistence';
import { createHTMLElementFromHTML } from '../utils/dom';
import React, { ContextType, TouchEventHandler } from 'react';
import XtermAdapter, { XtermAdapterHandle } from './XtermAdapter';
import NextCharsDisplay, { NextCharsDisplayHandle } from './NextCharsDisplay';
import { Output } from './Output';
import Game, { IGameHandle } from '../game/Game';
import ReactDOMServer from 'react-dom/server';
import { ActionType } from '../game/types/ActionTypes';
import Phrases from '../utils/Phrases';
import WebCam from '../utils/WebCam';
import { CommandContext } from '../commands/CommandContext';
import { Achievement, MyResponse } from '../types/Types';
import { TutorialComponent } from './TutorialComponent';
import { Chord } from './Chord';
import { SpritePosition } from '../game/types/Position';
import MonacoEditor, { MonacoEditorHandle } from './MonacoEditor';
import WpmTable from './WpmTable';
import './MonacoEditor.css'; // Make sure to import the CSS
import { loadCommandHistory, parseCommand } from '../utils/commandUtils';
import { getNextTutorialAchievement, loadTutorialAchievements } from '../utils/achievementUtils';
import { getNthPhraseNotAchieved, getPhrasesAchieved, getPhrasesNotAchieved, resetPhrasesAchieved } from '../utils/phraseUtils';
import UpdateCommandHistory from '../commands/UpdateCommandHistory';
import HelpCommand from '../commands/HelpCommand';
import UnlockAchievement from '../commands/UnlockAchievement';
import SpecialCommand from '../commands/SpecialCommand';
import { Prompt } from './Prompt';

export interface IHandTermProps {
  // Define the interface for your HandexTerm logic
  terminalWidth: number;
  auth: {
    login: (username: string, password: string) => Promise<MyResponse<any>>;
    logout: () => void;
    isLoggedIn: boolean;
    signUp: (
      username: string,
      password: string,
      email: string,
      callback: (error: any, result: any) => void
    ) => void;
    verify: (username: string, code: string, callback: (error: any, result: any) => void) => void;
    getUser: () => Promise<MyResponse<any>>;
    setUser: (profile: string) => void;
    saveLog: (key: string, content: string, extension: string) => Promise<MyResponse<any>>;
    getLog: (key: string, limit?: number) => Promise<MyResponse<any>>;
    changePassword: (
      oldPassword: string,
      newPassword: string,
      callback: (error: any, result: any) => void
    ) => void;
    getFile: (key: string, extension: string) => Promise<MyResponse<any>>;
    putFile: (key: string, content: string, extension: string) => Promise<MyResponse<any>>;
    listLog: () => Promise<MyResponse<any>>;
    getExpiresAt: () => string;
    refreshTokenIfNeeded: () => Promise<MyResponse<any>>;
    initiateGitHubAuth: () => void;
    listRecentRepos: () => Promise<MyResponse<any>>;
    getRepoTree: (path: string) => Promise<MyResponse<any>>;
    // Add other properties returned by useAuth here
  };
}

type LanguageType = "javascript" | "typescript" | "markdown";

export interface IHandTermState {
  // Define the interface for your HandexTerm state
  outputElements: React.ReactNode[];
  isInGameMode: boolean;
  phraseValue: string;
  phraseName: string;
  phraseIndex: number;
  targetWPM: number;
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
  commandHistoryIndex: number;
  commandHistoryFilter: string | null;
  isInSvgMode: boolean;
  lastTypedCharacter: string | null;
  phrasesAchieved: string[];
  errorCharIndex: number | undefined;
  editContent: string;
  editMode: boolean;
  editLanguage: LanguageType;
  editFilePath: string;
  editFileExtension: string;
  isShowVideo: boolean;
  githubAuthHandled: boolean;
  githubUsername: string | null;
  username: string | null;
  domain: string;
  timestamp: string;
}

class HandTerm extends React.Component<IHandTermProps, IHandTermState> {
  // Declare the context property with the type of your CommandContext
  static contextType = CommandContext;
  // TypeScript will now understand that this.context is of the type of your CommandContext
  declare context: ContextType<typeof CommandContext>;
  // Implement the interface methods
  private terminalElementRef = React.createRef<HTMLDivElement>();

  public adapterRef = React.createRef<XtermAdapterHandle>();
  private nextCharsDisplayRef: React.RefObject<NextCharsDisplayHandle> = React.createRef();
  private editorRef: React.RefObject<MonacoEditorHandle> = React.createRef();
  private terminalGameRef: React.RefObject<IGameHandle> = React.createRef();
  // Remove this line as we no longer need a ref for the editor

  private _persistence: IPersistence;
  public commandHistory: string[] = [];
  private wpmCalculator: IWPMCalculator = new WPMCalculator();
  private static readonly commandHistoryLimit = 120;
  private isDebug: boolean = false;
  private heroRunTimeoutId: number | null = null;
  private heroSummersaultTimeoutId: number | null = null;
  private lastTouchDistance: number | null = null;
  private currentFontSize: number = 17;
  outputRef = React.createRef<HTMLDivElement>();
  private inLoginProcess: boolean = false;
  private tempUserName: string = '';
  private tempNewPassword: string = '';
  private isInChangePasswordMode: boolean = false;
  private heroActionTimeoutId: number | null = null;
  private zombie4StartPostion: SpritePosition = { leftX: -50, topY: 0 }

  private handleGitHubAuth = () => {
    if (!this.state.githubAuthHandled) {
      const urlParams = new URLSearchParams(window.location.search);
      const githubAuth = urlParams.get('githubAuth');
      const githubUsername = urlParams.get('githubUsername');
      if (!githubUsername) return;
      if (githubAuth === 'success') {
        localStorage.setItem('githubUsername', githubUsername);
        window.history.replaceState({}, document.title, window.location.pathname);
        this.writeOutput(`GitHub authentication successful. Welcome, ${githubUsername}!`);
        this.setState({ 
          githubAuthHandled: true, 
          githubUsername: githubUsername 
        });
      }
    }
  }

  public handlePhraseErrorState = (errorIndex: number | undefined) => {
    this.setState({ errorCharIndex: errorIndex });
  };

  handleRemoveCharacter = (command: string) => {
    if (command.length === 0) {
      // Reset timer
      this.nextCharsDisplayRef.current?.resetTimer();
    }
    if (this.state.isInGameMode) {
      this.setState({
        commandLine: command,
      });
    }
  }

  handleEditChange = (content: string) => {
    this.setState({ editContent: content });
    localStorage.setItem('editContent', content);
  };

  handleEditSave = (content: string) => {
    this.props.auth.putFile(
      this.state.editFilePath,
      content,
      this.state.editFileExtension || 'md'
    ).catch((error) => {
      this.writeOutput(`Error saving file: ${error.message}`);
    });
    this.writeOutput(content || '');
  }

  handleEditorClose = () => {
    this.setState({ editMode: false }, () => {
      setTimeout(() => {
        this.focusTerminal();
      }, 100);
    });
  }

  resetTutorialAchievementState() {
    localStorage.removeItem('achievements');
    this.setState({
      unlockedAchievements: [],
      nextAchievement: getNextTutorialAchievement(),
      isInTutorial: true
    });
  }


  public focusTerminal() {
    if (this.adapterRef.current) {
      this.adapterRef.current.focusTerminal();
    }
  }


  private savePhrasesAchieved(phraseName: string, wpmAverage: number) {
    const wpmPhraseName = Math.round(wpmAverage) + ':' + phraseName;
    const matchingPhrases = this.state.phrasesAchieved
      .filter(p => { return p.split(":")[1] === this.state.phraseName });
    if (matchingPhrases.length > 0) return;
    // set state
    this.setState((prevState) => ({
      phrasesAchieved: [...prevState.phrasesAchieved, wpmPhraseName]
    }))

    const storedPhrasesAchievedString: string = localStorage.getItem('phrasesAchieved') || '';
    let storedPhrasesAchieved = storedPhrasesAchievedString ? JSON.parse(storedPhrasesAchievedString) : [];
    const matchingStoredPhrases = storedPhrasesAchieved
      .filter((p: string) => { return p.split(":")[1] === this.state.phraseName });
    if (matchingStoredPhrases.length > 0) return;
    storedPhrasesAchieved.push(wpmPhraseName);
    localStorage.setItem('phrasesAchieved', JSON.stringify(storedPhrasesAchieved));
  }

  private loadTargetWPM(): number {
    const storedTargetWPM = localStorage.getItem(LogKeys.TargetWPM);
    return storedTargetWPM ? parseInt(storedTargetWPM) : 25;
  }

  constructor(IHandexTermProps: IHandTermProps) {
    super(IHandexTermProps);
    this._persistence = new LocalStoragePersistence();
    const initialCanvasHeight = localStorage.getItem('canvasHeight') || '100';
    const nextAchievement = getNextTutorialAchievement();
    this.state = {
      domain: 'handterm.io',
      username: null,
      timestamp: new Date().toTimeString().split('(')[0],
      outputElements: this.getCommandResponseHistory().slice(-1),
      isInGameMode: false,
      phraseValue: '', // Initial value
      phraseName: '',
      phraseIndex: 0,
      phrasesAchieved: getPhrasesAchieved()
        .map((phrase: { wpm: number; phraseName: string }) => phrase.phraseName),
      targetWPM: this.loadTargetWPM(),
      isActive: false,
      commandLine: '',
      heroAction: 'Idle',
      zombie4Action: 'Walk',
      terminalSize: undefined,
      terminalFontSize: 17,
      canvasHeight: parseInt(initialCanvasHeight),
      unlockedAchievements: loadTutorialAchievements(),
      nextAchievement: nextAchievement,
      isInTutorial: true,
      commandHistory: loadCommandHistory(),
      commandHistoryIndex: -1,
      commandHistoryFilter: null,
      isInSvgMode: false,
      lastTypedCharacter: null,
      errorCharIndex: undefined,
      editContent: '',
      editMode: false,
      // Default edit language
      editLanguage: "markdown",
      // Default edit file path
      editFilePath: "_index",
      editFileExtension: "md",
      isShowVideo: false,
      githubAuthHandled: false,
      githubUsername: localStorage.getItem('githubUsername') || null,
    }
    this.loadDebugValue();
    this.loadFontSize();
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
      this.adapterRef.current.terminalWrite(localStorage.getItem('currentCommand') || '');
    }
    this.scrollToBottom();

    this.addTouchListeners();

    this.handleGitHubAuth();
  }

  componentDidUpdate(_prevProps: Readonly<IHandTermProps>, _prevState: Readonly<IHandTermState>, _snapshot?: any): void {
    this.handleGitHubAuth();
  }

  componentWillUnmount(): void {
    if (this.heroRunTimeoutId) {
      clearTimeout(this.heroRunTimeoutId);
    }
    this.removeTouchListeners();
  }

  handleFocusEditor = () => {
    setTimeout(() => {
      if (this.editorRef.current) {
        this.editorRef.current.focus();
      }
    }, 100);
  };

  public handleCommand = (cmd: string): void => {
    UpdateCommandHistory({
      cmd,
      state: this.state,
      setState: (newState: any) => this.setState(newState)
    });

    if (cmd === 'tut' && !this.state.isInTutorial) {
      this.resetTutorialAchievementState();
    }

    if (this.state.isInTutorial || cmd === 'tut') {
      // Unlock the next achievement and decide if we are still in tutorial mode
      UnlockAchievement({
        achievementPhrase: cmd,
        nextAchievement: this.state.nextAchievement,
        unlockedAchievements: this.state.unlockedAchievements,
        setState: (newState: any) => this.setState(newState)
      });
    }

    const { command, args, switches } = parseCommand(cmd);
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
    this.setState({ isInGameMode: false, commandLine: '' });

    if (command === 'help' || command === '411') {
      status = 200;
      const helpResponse = <HelpCommand command={command} />;
      response = ReactDOMServer.renderToStaticMarkup(helpResponse);
    }

    if (command === 'special') {
      status = 200;
      // Write out all the spcieal characters to the output
      const specialCharsHtml = ReactDOMServer.renderToStaticMarkup(<SpecialCommand />);
      response = specialCharsHtml;
    }

    if (command === 'edit') {
      const expiresAtString = this.props.auth.getExpiresAt();
      if (!expiresAtString) {
        response = "You must login to edit files.";
        this.writeOutput(response);
        status = 401;
        this.setState({ editMode: false });
        this.adapterRef.current?.prompt();
        return;
      }
      response = `Editing ${this.state.editFilePath}.${this.state.editFileExtension}`;
      (async () => {
        const fileContent = await this.props.auth.getFile(
          this.state.editFilePath, this.state.editFileExtension
        );
        this.setState({
          editContent: fileContent.data,
          editMode: true,
        }, () => {
          this.handleFocusEditor();
        });
      })();
    }

    if (command === 'target') {
      if (args.length === 0) {
        response = "Target WPM: " + this.state.targetWPM;
      } else {
        const targetWPMString = args[0] || '';
        const targetWPM: number = parseInt(targetWPMString, 10);
        if (!isNaN(targetWPM)) {
          this.setState({ targetWPM: targetWPM });
          localStorage.setItem(LogKeys.TargetWPM, targetWPM.toString());
          resetPhrasesAchieved();
          response = "Target WPM set to " + targetWPM.toString();
        } else {
          response = "Target WPM must be a number";
        }
      }
    }

    if (command === 'show') {
      if (args.length === 0) {
        response = getPhrasesAchieved().map((phrase: { wpm: number; phraseName: string; }) => `${phrase.wpm}:${phrase.phraseName}`).join('<br/>');
        status = 200;
      }
    }

    if (command.startsWith('cat')) {
      if (args.length === 0) {
        status = 200;
        const filename = command.split(' ')[1] || '_index';
        (async () => {
          try {
            const userResponse: any = await this.props.auth.getFile(filename, 'md');

            if (userResponse.status === 200) {
              const content = userResponse.data.replaceAll('\n', '<br />');
              this.writeOutput(content);
            } else {
              this.writeOutput(userResponse.error.join('<br/>'));
            }
          } catch (error) {
            console.error("Error fetching user:", error);
          }
        })();
        response = "Getting profile";
      } else {
        const content = args.join(' ');
        this.props.auth.setUser(content);
      }
    }

    if (command === 'profile') {
      status = 200;
      this.props.auth.getUser().then((user: any) => {
        this.writeOutput(JSON.stringify(user));
      });
      return;
    }

    if (command === 'github') {
      status = 200;
      response = "Opening github.com for you to authenticate there.";
      if (!this.state.githubUsername) {
        this.props.auth.initiateGitHubAuth();
      } else {
        if(args) {
          // TODO: Handle Github file tree
          if(JSON.parse(localStorage.getItem(LogKeys.RepoNames) || '[]').includes(args[0])) {
            this.props.auth.getRepoTree(args[0]);
          }
        }
        this.props.auth.listRecentRepos().then((repos: any) => {
          console.log("repos: ", repos);
          const repoNames = Array.from(repos).map((repo: any) => repo.name);
          localStorage.setItem(LogKeys.RepoNames, JSON.stringify(repoNames));
          const reponameText = repoNames.join('<br/>');

          console.log("repoNames: ", repoNames);
          this.writeOutput(reponameText);
        });
      }
      return;
    }

    if (command === 'signup') {
      response = "Signing up. Enter <username> <password> <email> (without <>)";
      const commandSlices = cmd.split(' ');
      this.props.auth.signUp(commandSlices[1], commandSlices[2], commandSlices[3], (error, result) => {
        if (error) {
          console.error(error);
          response = "Error signing up." + result;
          status = 500;
        }
        else {
          response = "Sign up successful!" + result;
          status = 200;
        }
      })
    }

    if( command === 'verify') {
      const commandSlices = cmd.split(' ');
      if (commandSlices.length < 3) {
        response = "Please provide a username and verification code.";
        status = 400;
      } else {
        this.props.auth.verify(commandSlices[1], commandSlices[2], (error, result) => {
          if (error) {
            console.error(error);
            response = "Error verifying username." + result;
            status = 500;
          }
          else {
            response = "Verification successful!" + result;
            status = 200;
          }
        })
      }
    }

    if (command === 'login') {
      const expiresAtString = this.props.auth.getExpiresAt();
      if (expiresAtString) {
        if (new Date(parseInt(expiresAtString, 10)) > new Date()) {
          status = 200;
          response = "Already logged in.";
          this.adapterRef.current?.prompt();
          return;
        }
        else {
          // refresh token and see if that worked.
          this.props.auth.refreshTokenIfNeeded().then(() => {
            this.writeOutput("You are already logged in.")
            this.inLoginProcess = false;
            this.adapterRef.current?.prompt();
            return;
          });
        }
      }
      response = "Logging in...<br />Type your password at the prompt. \"*\" will be displayed as you type.";
      const commandSlices = cmd.split(' ');
      if (commandSlices.length < 2) {
        response = "Please provide a username.";
        status = 400;
      } else {
        this.inLoginProcess = true;
        this.tempUserName = commandSlices[1];
      }
    }

    if (command === 'logout') {
      status = 200;
      response = "Logging out...";
      this.props.auth.logout();
      this.adapterRef.current?.prompt();
      return;
    }

    if (command.startsWith('level')) {
      if (!this.terminalGameRef.current) return;
      let levelNum = command.match(/\d+/);
      const level = levelNum && levelNum.length ? parseInt(levelNum[0]) : null;
      this.terminalGameRef.current?.levelUp(level);
    }

    if (command === 'play' || command === 'phrase') {
      status = 200;
      response = "Type the phrase as fast as you can."
      this.setState({
        phraseIndex: 0,
      });
      this.setNewPhrase(args.join(''));
      this.terminalGameRef.current?.handleZombie4PositionChange(this.zombie4StartPostion);
    }

    if (command === 'svg') {
      // toggle svg mode
      this.setState({ isInSvgMode: !this.state.isInSvgMode });
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
    if (this.state.isInGameMode) {
      response = '';
      this.setState({ isInGameMode: false });
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
    if (this.commandHistory.length > HandTerm.commandHistoryLimit) {
      this.commandHistory.shift(); // Remove the oldest command
    }
    if (command !== 'Return') this.saveCommandResponseHistory(command, response, status); // Save updated history to localStorage
    return;
  }

  public prompt = () => {
    this.adapterRef.current?.prompt();
  }

  public handleCharacter = (character: string) => {
    const charDuration: CharDuration = this.wpmCalculator.addKeystroke(character);
    const currentCommand = this.adapterRef.current?.getCurrentCommand();

    localStorage.setItem(LogKeys.CurrentCommand, currentCommand + character);
    const charCodes: number[] = character.split('').map(char => char.charCodeAt(0));
    if (this.state.isInSvgMode) {
      // TODO: Show last character of current command SVG. Handle backspace and return properly. 
      this.setState({ lastTypedCharacter: character });
    } else {
      this.setState({ lastTypedCharacter: null });
    }
    if (this.inLoginProcess) {
      if (character === '\r') {
        this.inLoginProcess = false;
        // Immediately invoked async function to use await
        (async () => {
          try {
            const result = await this.props.auth.login(this.tempUserName, this.getTempPassword());
            if (result.status === 200) {
              this.writeOutput(`Login successful! Status: ${JSON.stringify(result.status)}`);
              // SET USERNAME
              // TODO: Set other user properties such as githubUsername
              this.setState({username: this.tempUserName});
              localStorage.setItem(LogKeys.Username, this.tempUserName);
            } else {
              this.writeOutput(`Login failed! Status: ${JSON.stringify(result.status)}<br />${result.message}`);
            }
            this.prompt();
          } catch (error: any) {
            this.writeOutput(`Login failed: ${error.message}`);
          } finally {
            this.tempUserName = '';
            this.terminalReset();
            this.resetTempPassword();
          }
        })();
      }
      else {
        this.appendTempPassword(character);
        this.terminalWrite("*");
        return;
      }
    }
    if (this.isInChangePasswordMode) {
      if (character === '\r') {

        this.props.auth.changePassword(this.getTempPassword(), this.tempNewPassword, (error: any, result: any) => {
          if (error) {
            console.error(error);
          }
          else {
            this.writeOutput(`Password changed successfully! Status: ${result}`);
          }
          this.isInChangePasswordMode = false;
          this.terminalReset();
        })
        this.resetTempPassword();
      }
      else {
        this.appendTempPassword(character);
        this.terminalWrite("*");
        return;
      }
    }
    if (character.charCodeAt(0) === 3) { // Ctrl+C
      localStorage.setItem(LogKeys.CurrentCommand, '');
      this.setState({
        isInGameMode: false,
        commandLine: ''
      });
      this.writeOutput('');
      this.adapterRef.current?.terminalReset();
      this.adapterRef.current?.prompt();
    }
    if (character === 'ArrowUp') {
      const currentCommand = this.state.commandHistoryFilter || this.adapterRef.current?.getCurrentCommand();
      this.setState({ commandHistoryFilter: currentCommand || null });
      let newCommandIndex = (this.state.commandHistoryIndex + 1) % this.state.commandHistory.length;
      let command = this.state
        .commandHistory
        .filter((ch) => ch.startsWith(currentCommand || ''))[newCommandIndex];
      const commandResponseHistory = this.getCommandResponseHistory().reverse();
      this.setState({
        commandHistoryIndex: newCommandIndex,
        commandLine: command,
        outputElements: [commandResponseHistory[newCommandIndex]],
      });

      this.terminalReset();
      this.terminalPrompt();
      this.terminalWrite(command);
      return;
    }
    if (charCodes.join(',') == '27,91,66') { // ArrowDown
      const currentCommand = this.state.commandHistoryFilter;
      let newCommandIndex = (this.state.commandHistoryIndex - 1 + this.state.commandHistory.length)
        % this.state.commandHistory.length;
      if (newCommandIndex < 0) newCommandIndex = 0;
      if (newCommandIndex >= this.state.commandHistory.length) newCommandIndex = this.state.commandHistory.length - 1;
      let command = this.state
        .commandHistory
        .filter((ch) => ch.startsWith(currentCommand || ''))[newCommandIndex];
      const commandResponseHistory = this.getCommandResponseHistory().reverse();
      this.setState({
        commandHistoryIndex: newCommandIndex,
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
      localStorage.setItem('currentCommand', '');
      this.terminalReset();
      this.handleCommand(command);
    } else if (this.state.isInGameMode) {
      // # IN PHRASE MODE
      // TODO: How is Game success handeled here?
      if (this.state.errorCharIndex) {

      }
      this.terminalWrite(character);
      let command = this.adapterRef.current?.getCurrentCommand() ?? '';
      command += character;

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
    const { wpmAverage, charWpms } = this.wpmCalculator.getWPMs();
    this.wpmCalculator.saveKeystrokes(timeCode);
    this.wpmCalculator.clearKeystrokes();
    commandResponseElement.innerHTML = commandResponseElement
      .innerHTML
      .replace(/{{wpm}}/g, wpmAverage.toFixed(0));

    commandText = commandText.replace(/{{wpm}}/g, wpmAverage.toFixed(0));

    if (!this.commandHistory) { this.commandHistory = []; }
    const commandResponse = commandResponseElement.outerHTML;
    const characterAverages = this.averageWpmByCharacter(charWpms.filter(wpm => wpm.durationMilliseconds > 1));
    const slowestCharacters = (
      <WpmTable
        wpms={characterAverages.sort((a, b) => a.wpm - b.wpm).slice(0, 5)}
        name="slow-chars"
      />
    );

    const slowestCharactersHTML = ReactDOMServer.renderToStaticMarkup(slowestCharacters);

    commandResponseElement.innerHTML += slowestCharactersHTML;
    this.writeOutput(commandResponse)

    // Now you can append slowestCharactersHTML as a string to your element's innerHTML
    this._persistence.setItem(`${LogKeys.Command}_${timeCode}`, commandResponseElement.outerHTML);

    return commandResponse;
  }

  writeOutput(output: string) {
    this.commandHistory = [output];
    this.setState({ outputElements: [output] });
  }

  createCommandRecord(command: string, commandTime: Date): string {
    let commandText = `<div class="log-line"><span class="log-time">[${this.createTimeHTML(commandTime)}]</span><span class="wpm-label">WPM:</span><span class="wpm">{{wpm}}</span>${command}</div>`;
    return commandText;
  }

  private createTimeCode(now = new Date()): string[] {
    return now.toISOString().split(':');
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

  private handlePhraseSuccess = (phrase: string) => {
    const wpms = this.wpmCalculator.getWPMs();
    const wpmAverage = wpms.wpmAverage;

    if (wpmAverage > this.state.targetWPM) {
      this.savePhrasesAchieved(this.state.phraseName, wpmAverage);
    }

    let wpmPhrase = wpmAverage.toString(10)
      + ':' + phrase;
    this.setState(
      prevState => ({
        outputElements: [
          ...prevState.outputElements,
          wpmPhrase
          + wpms.charWpms.join(', ')
        ]
      })
    );
    this.saveCommandResponseHistory("game", wpmPhrase, 200);
    this.terminalGameRef.current?.completeGame();
    this.terminalGameRef.current?.levelUp();
    this.handlePhraseComplete();
    this.adapterRef.current?.terminalReset();
    this.adapterRef.current?.prompt();
  }

  private handlePhraseComplete = () => {

    localStorage.setItem('currentCommand', '');
    let newPhraseIndex = (this.state.phraseIndex) % Phrases.phrases.length;
    let newPhrase = getPhrasesNotAchieved()[newPhraseIndex];
    this.setState({
      phraseIndex: newPhraseIndex + 1,
      phraseValue: newPhrase.value,
      phraseName: newPhrase.key,
    });
    if (this.nextCharsDisplayRef.current) this.nextCharsDisplayRef.current.cancelTimer();
    this.terminalGameRef.current?.completeGame();
    this.adapterRef.current?.terminalReset();
  }

  private setNewPhrase = (phraseName: string) => {
    phraseName = phraseName.replace('phrase ', '');

    const newPhrase
      = phraseName && phraseName != "" && Phrases.getPhraseByKey(phraseName)
        ? Phrases.getPhraseByKey(phraseName)
        : getNthPhraseNotAchieved(this.state.phraseIndex);

    this.setState((prevState) => {
      return {
        ...prevState,
        isInGameMode: true,
        phraseValue: newPhrase.value,
        phraseName: newPhrase.key,
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
    // Clear any existing timeout to reset the timer
    if (this.heroActionTimeoutId) {
      clearTimeout(this.heroActionTimeoutId);
      this.heroActionTimeoutId = null;
    }
    this.setState({ heroAction: newAction });
    // Set a timeout to stop the hero from running after 500ms
    if (newAction === 'Death') return;
    this.heroActionTimeoutId = window.setTimeout(() => {
      this.setState({ heroAction: 'Idle' });
      this.heroActionTimeoutId = null; // Clear the timeout ID
    }, 500);
  }

  setZombie4Action = (newAction: ActionType) => {
    this.setState({ zombie4Action: newAction });
  }

  handleTimerStatusChange(isActive: boolean) {
    this.setState({ isActive });
  }

  public terminalReset(): void {
    this.adapterRef.current?.terminalReset();
  }

  private terminalPrompt(): void {
    this.adapterRef.current?.prompt();
  }

  private terminalWrite(data: string): void {
    this.adapterRef.current?.terminalWrite(data);
  }

  private appendTempPassword(password: string): void {
    this.adapterRef.current?.appendTempPassword(password);
  }
  private resetTempPassword(): void {
    this.adapterRef.current?.resetTempPassword();
  }
  private getTempPassword(): string {
    return this.adapterRef.current?.getTempPassword() || '';
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
        document.documentElement.style.setProperty('--terminal-font-size', `${this.currentFontSize}px`);
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
    this.setState((prevState) => ({
      isShowVideo: !prevState.isShowVideo
    }))
    return !this.state.isShowVideo;
  }

  public render() {
    const { terminalSize } = this.state;
    const canvasWidth = terminalSize ? terminalSize.width : 800;
    // canvas height does not need to match terminal height

    return (
      <CommandContext.Consumer>
        {(context) => {
          if (context !== this.context) {
            // Update context in a safe way
            setTimeout(() => {
              this.context = context;
              this.forceUpdate();
            }, 0);
          }
          return (
            <div className="terminal-container">
              <Output
                ref={this.outputRef}
                elements={this.state.outputElements}
                onTouchStart={this.handleTouchStart}
                onTouchEnd={this.handleTouchEnd}
              />
              <Game
                ref={this.terminalGameRef}
                canvasHeight={this.state.canvasHeight}
                canvasWidth={canvasWidth} // Use the width from terminalSize if available
                isInGameMode={this.state.isInGameMode}
                heroActionType={this.state.heroAction}
                zombie4ActionType={this.state.zombie4Action}
                onSetHeroAction={this.setHeroAction}
                onSetZombie4Action={this.setZombie4Action}
                onTouchStart={this.handleTouchStart}
                onTouchEnd={this.handleTouchEnd}
                phrasesAchieved={this.state.phrasesAchieved}
                zombie4StartPosition={this.zombie4StartPostion}
              />
              {this.state.isInGameMode && this.state.phraseValue && (
                <NextCharsDisplay
                  ref={this.nextCharsDisplayRef}
                  commandLine={this.state.commandLine}
                  isInPhraseMode={this.state.isInGameMode}
                  newPhrase={this.state.phraseValue}
                  onPhraseSuccess={this.handlePhraseSuccess}
                  onError={this.handlePhraseErrorState}
                />
              )}
              {this.state.lastTypedCharacter && (
                <Chord displayChar={this.state.lastTypedCharacter} />
              )}
              {Array.isArray(this.state.nextAchievement?.phrase) &&
                TutorialComponent && (
                  <TutorialComponent
                    achievement={this.state.nextAchievement}
                    isInTutorial={this.state.isInTutorial}
                    includeReturn={true}
                  />
                )
              }
              <Prompt
                username={this.state.username || 'guest'}
                domain={this.state.domain || 'handterm'}
                githubUsername={this.state.githubUsername}
                timestamp={this.state.timestamp}
              />
              {!this.state.editMode && (
                <XtermAdapter
                  ref={this.adapterRef}
                  terminalElementRef={this.terminalElementRef}
                  terminalFontSize={this.currentFontSize}
                  onAddCharacter={this.handleCharacter}
                  onRemoveCharacter={this.handleRemoveCharacter}
                  onTouchStart={this.handleTouchStart}
                  onTouchEnd={this.handleTouchEnd}
                />
              )}
              {this.state.editMode && (
                <MonacoEditor
                  initialValue={this.state.editContent}
                  language={this.state.editLanguage}
                  onChange={(value) => this.handleEditChange(value || '')}
                  onSave={this.handleEditSave}
                  onClose={this.handleEditorClose}
                  toggleVideo={this.toggleVideo}
                />
              )}
              {this.state.isShowVideo && (
                <WebCam
                  setOn={this.state.isShowVideo}
                />
              )}
            </div>
          );
        }}
      </CommandContext.Consumer>
    );
  }
}

HandTerm.contextType = CommandContext;
export default HandTerm;
