/** @jsxImportSource react */
import { LogKeys, CharWPM } from '../types/TerminalTypes';
import * as ReactDOMServer from 'react-dom/server';
import WpmTable from './WpmTable';
import { IWPMCalculator, WPMCalculator } from '../utils/WPMCalculator';
import { IPersistence, LocalStoragePersistence } from '../Persistence';
import { createHTMLElementFromHTML } from '../utils/dom';
import * as React from 'react';
import { ContextType } from 'react';
import { ActionType } from '../game/types/ActionTypes';
import WebCam from '../utils/WebCam';
import { CommandContext } from '../commands/CommandContext';
import { ActivityType, Tutorial } from '../types/Types';
import MonacoEditor, { MonacoEditorHandle } from './MonacoEditor';
import './MonacoEditor.css'; // Make sure to import the CSS
import { loadTutorials } from '../utils/tutorialUtils';
import { createTimeCode } from '../utils/timeUtils';
import { TimeDisplay } from './TimeDisplay';
import { useCommandHistory } from '../hooks/useCommandHistory';
import { useActivityMediator } from '../hooks/useActivityMediator';
// import HelpCommand from '../commands/HelpCommand';
// import SpecialCommand from '../commands/SpecialCommand';
import { IAuthProps } from 'src/lib/useAuth';
import { IGameHandle } from 'src/game/Game';

export interface IHandTermMethods {
  writeOutput: (output: string) => void;
  prompt: () => void;
  terminalReset: () => void;
  saveCommandResponseHistory: (command: string, response: string, status: number) => string;
  focusTerminal: () => void;
  handleCommand: (cmd: string) => void;
  handleCharacter: (character: string) => void;
  toggleVideo: () => boolean;
  refreshComponent: () => void;
  setHeroSummersaultAction: ()=>void; 
  // Add other methods as needed
}

export type HandTermRef = React.RefObject<IHandTermMethods>;

export interface IHandTermProps {
  // Define the interface for your HandexTerm logic
  terminalWidth: number;
  auth: IAuthProps;
  commandHistoryHook: ReturnType<typeof useCommandHistory>;
  onOutputUpdate: (output: React.ReactNode) => void;
  onCommandExecuted: (command: string, args: string[], switches: Record<string, boolean | string>) => void;
  onActivityChange: (newActivityType: ActivityType) => void;
  refreshHandTerm: () => void;
  activityMediator: ReturnType<typeof useActivityMediator>;
  currentTutorial: Tutorial | null;
  currentActivity: ActivityType;
  setCurrentActivity: (currentActivity:ActivityType)=>void;
  gameHandleRef: React.RefObject<IGameHandle>;
  onEditorClose: ()=>void;
}

type LanguageType = "javascript" | "typescript" | "markdown";

export interface IHandTermState {
  // Define the interface for your HandexTerm state
  phraseKey: string;
  phraseIndex: number;
  targetWPM: number;
  isActive: boolean;
  terminalSize: { width: number; height: number } | undefined;
  terminalFontSize: number;
  unlockedAchievements: string[];
  isInSvgMode: boolean;
  lastTypedCharacter: string | null;
  errorCharIndex: number | undefined;
  editContent: string;
  editMode: boolean;
  editLanguage: LanguageType;
  editFilePath: string;
  editFileExtension: string;
  isShowVideo: boolean;
  githubAuthHandled: boolean;
  githubUsername: string | null;
  userName: string | null;
  domain: string;
  timestamp: string;
  commandHistory: string[];
  commandHistoryIndex: number;
  commandHistoryFilter: string | null;
  outputElements: React.ReactNode[];
}

// @ts-ignore
export class HandTerm extends React.PureComponent<IHandTermProps, IHandTermState> implements IHandTermMethods {
  static contextType = CommandContext;
  declare context: ContextType<typeof CommandContext>;
  declare props: IHandTermProps;
  declare setState: React.Component['setState'];

  private editorRef: React.RefObject<MonacoEditorHandle> = React.createRef();
  outputRef = React.createRef<HTMLDivElement>();

  private heroRunTimeoutId: number | null = null;
  private heroSummersaultTimeoutId: number | null = null;
  private heroActionTimeoutId: number | null = null;

  private _persistence!: IPersistence;
  private wpmCalculator: IWPMCalculator = new WPMCalculator();
  private isDebug: boolean = false;
  private currentFontSize: number = 17;

  private commandHistoryHook: ReturnType<typeof useCommandHistory>;

  constructor(props: IHandTermProps) {
    super(props);
    this._persistence = new LocalStoragePersistence();
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    this.commandHistoryHook = props.commandHistoryHook;

    this.state = {
      domain: 'handterm.com',
      userName: isLoggedIn ? localStorage.getItem(LogKeys.Username) || null : null,
      timestamp: new Date().toTimeString().split('(')[0],
      outputElements: this.commandHistoryHook.getCommandResponseHistory().slice(-1),
      phraseKey: '',
      phraseIndex: 0,
      targetWPM: this.loadTargetWPM(),
      isActive: false,
      terminalSize: undefined,
      terminalFontSize: 17,
      unlockedAchievements: loadTutorials(),
      isInSvgMode: false,
      lastTypedCharacter: null,
      errorCharIndex: undefined,
      editContent: '',
      editMode: false,
      editLanguage: "markdown",
      editFilePath: "_index",
      editFileExtension: "md",
      isShowVideo: false,
      githubAuthHandled: false,
      githubUsername: isLoggedIn ? localStorage.getItem(LogKeys.GitHubUsername) || null : null,
      commandHistory: this.commandHistoryHook.commandHistory,
      commandHistoryIndex: this.commandHistoryHook.commandHistoryIndex,
      commandHistoryFilter: this.commandHistoryHook.commandHistoryFilter,
    }
    this.loadDebugValue();
    this.loadFontSize();
  }

  
  public refreshComponent = () => {
    this.setState({ _forceRender: Date.now() }); // _forceRende is a dummy state property
  };


  handleEditChange = (content: string | undefined) => {
    this.setState({ editContent: content || '' });
    localStorage.setItem('editContent',  content || '');
  };

  handleEditSave = (content: string) => {
    this.props.auth.putFile(
      this.state.editFilePath,
      content,
      this.state.editFileExtension || 'md'
    ).catch((error: Error) => {
      this.writeOutput(`Error saving file: ${error.message}`);
    });
    this.writeOutput(content || '');
  }

  private loadTargetWPM(): number {
    const storedTargetWPM = localStorage.getItem(LogKeys.TargetWPM);
    return storedTargetWPM ? parseInt(storedTargetWPM) : 25;
  }

  componentDidUpdate(prevProps: Readonly<IHandTermProps>, _prevState: Readonly<IHandTermState>): void {
    // NOTE: This runs on every keypress.
    // this.handleGitHubAuth();
    console.log("HandTerm didUpdate", prevProps);
  }

  componentWillUnmount(): void {
    if (this.heroRunTimeoutId) {
      clearTimeout(this.heroRunTimeoutId);
    }
  }

  handleFocusEditor = () => {
    setTimeout(() => {
      if (this.editorRef.current) {
        this.editorRef.current.focus();
      }
    }, 100);
  };

  public prompt = () => {
    // this.adapterRef.current?.prompt();
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
    const timeCode = createTimeCode(commandTime).join(':');
    let commandText = this.createCommandRecord(command, commandTime);
    // TODO: Render this with JSX instead.
    const commandElement = createHTMLElementFromHTML(commandText);
    const commandResponseElement = document.createElement('div');
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

    commandText = commandText.replace(/\{\{wpm\}\}/g, wpmAverage.toFixed(0));

    const commandResponse = commandResponseElement.outerHTML;
    const characterAverages = this.averageWpmByCharacter(charWpms.filter(wpm => wpm.durationMilliseconds > 1));
    const slowestCharactersHTML = ReactDOMServer.renderToStaticMarkup(
      <WpmTable
        wpms={characterAverages.sort((a, b) => a.wpm - b.wpm).slice(0, 5)}
        name="slow-chars"
      />
    );

    commandResponseElement.innerHTML += slowestCharactersHTML;
    this.writeOutput(commandResponseElement.outerHTML);

    // Now you can append slowestCharactersHTML as a string to your element's innerHTML
    this._persistence.setItem(`${LogKeys.Command}_${timeCode}`, commandResponseElement.outerHTML);

    return commandResponse;
  }

  writeOutput(output: string) {
    this.commandHistoryHook.addToCommandHistory(output);
    this.props.onOutputUpdate(output);
  }

  createCommandRecord(command: string, commandTime: Date): string {
    const timeDisplay = ReactDOMServer.renderToString(<TimeDisplay time={commandTime} />);
    return `
      <div class="log-line">
        <span class="log-time">[${timeDisplay}]</span>
        <span class="wpm-label">WPM:</span>
        <span class="wpm">{{wpm}}</span>
        ${command}
      </div>
    `;
  }

  toggleIsDebug(setIsDebug?: boolean) {
    this.isDebug = setIsDebug ?? !this.isDebug;
    localStorage.setItem('xterm-debug', String(this.isDebug));
    console.log('Xterm debug:', this.isDebug);
  }

  private loadDebugValue() {
    this.isDebug = localStorage.getItem('xterm-debug') === 'true';
  }

  setHeroRunAction = () => {
    if (this.heroRunTimeoutId) {
      clearTimeout(this.heroRunTimeoutId);
      this.heroRunTimeoutId = null;
    }

    this.props.activityMediator.setHeroAction('Run');
    this.heroRunTimeoutId = window.setTimeout(() => {
      this.props.activityMediator.setHeroAction('Idle');
      this.heroRunTimeoutId = null;
    }, 800);
  }

  public setHeroSummersaultAction = () => {
    if (this.heroSummersaultTimeoutId) {
      clearTimeout(this.heroSummersaultTimeoutId);
      this.heroSummersaultTimeoutId = null;
    }

    this.props.activityMediator.setHeroAction('Summersault');
    this.heroSummersaultTimeoutId = window.setTimeout(() => {
      this.props.activityMediator.setHeroAction('Idle');
      this.heroSummersaultTimeoutId = null;
    }, 800);
  }

  setHeroAction = (newAction: ActionType) => {
    if (this.heroActionTimeoutId) {
      clearTimeout(this.heroActionTimeoutId);
      this.heroActionTimeoutId = null;
    }
    this.props.activityMediator.setHeroAction(newAction);
    if (newAction === 'Death') return;
    this.heroActionTimeoutId = window.setTimeout(() => {
      this.props.activityMediator.setHeroAction('Idle');
      this.heroActionTimeoutId = null;
    }, 500);
  }

  setZombie4Action = (newAction: ActionType) => {
    this.props.activityMediator.setZombie4Action(newAction);
  }

  handleTimerStatusChange(isActive: boolean) {
    this.setState({ isActive });
  }


  private loadFontSize(): void {
    const getFontSize: string = localStorage.getItem('terminalFontSize') || this.currentFontSize.toString();
    const fontSize = (getFontSize && getFontSize == 'NaN') ? this.currentFontSize : parseInt(getFontSize);

    if (fontSize) {
      this.currentFontSize = fontSize;
      document.documentElement.style.setProperty('--terminal-font-size', `${this.currentFontSize}px`);
    }
  }

  public toggleVideo = (): boolean => {
    this.setState((prevState: IHandTermState) => ({
      isShowVideo: !(prevState.isShowVideo || false)
    }))
    return !this.state.isShowVideo;
  }

  public render() {
    const { editMode, editContent, editLanguage, isShowVideo } = this.state;

    return (
      <CommandContext.Consumer>
        {(context) => {
          if (context !== this.context) {
            setTimeout(() => {
              this.context = context;
              this.forceUpdate();
            }, 0);
          }

          return (
            <div className="terminal-container">
              {editMode && (
                <MonacoEditor
                  initialValue={editContent}
                  language={editLanguage}
                  onChange={(value) => this.handleEditChange(value || '')}
                  onSave={this.handleEditSave}
                  onClose={this.props.onEditorClose}
                  toggleVideo={this.toggleVideo}
                />
              )}
              {isShowVideo && (
                <WebCam
                  setOn={isShowVideo}
                />
              )}
            </div>
          );
        }}
      </CommandContext.Consumer>
    );
  }

  forceUpdate(callback?: () => void): void {
    super.forceUpdate(callback);
  }
}

HandTerm.contextType = CommandContext;
