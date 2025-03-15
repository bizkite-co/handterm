// @ts-nocheck
import { type ReactNode } from "react";
import { ActionType, ActivityType } from './runtimeConstants.js';
export type { Signal, ReadonlySignal } from './signal.js';
export * from './miscTypes.js';
export * from './runtimeConstants.js';
export * from './window.js';
export * from './TerminalTypes.js';
export * from './phrases.js';
export type { IStandaloneCodeEditor } from './monaco.js';

export interface GamePhrase {
  key: string;
  displayAs: string;
  value: string;
  tutorialGroup?: string;
}



// Core Types
export interface CharTime {
  char: string;
  duration: number;
  time: number;
}

export interface Keystroke {
  char: string;
  timestamp: number;
}

export type ParsedCommand = Readonly<{
  command: string;
  args: readonly string[];
  switches: Readonly<Record<string, boolean | string>>;
}>;

export type CancelCallback = () => void;

export type InputEventCallback = (event: InputEvent) => void;

export interface ChordRow {
  char: string;
  chord: number;
  strokes: string;
}

export interface IChord {
  key: string;
  chordCode: string;
  index: number;
  alias?: string;
}

export interface WPM {
  readonly wpm: number;
  readonly character: string;
  readonly durationMilliseconds: number;
}

export type WPMs = Readonly<{
  wpmAverage: number;
  charWpms: ReadonlyArray<WPM>;
}>;

export interface OutputElement {
  command: ParsedCommand;
  response?: ReactNode;
  status: number;
  wpmAverage?: number;
  characterAverages?: ReadonlyArray<WPM>;
  commandTime: Date;
  component?: ReactNode;
  sensitive?: boolean;
}

export interface BaseResponse {
  status: 200 | 400 | 401 | 403 | 404 | 500;
  message: string | undefined;
  error: string[];
}

export interface DataResponse<T> extends BaseResponse {
  data?: T;
}

export interface ErrorResponse extends BaseResponse {
  status: 400 | 401 | 403 | 404 | 500;
  data?: never;
}

export interface TreeItem {
  path: string;
  type: 'file' | 'directory';
}

export interface IHandTermWrapperProps {
  terminalWidth: number;
  auth: IAuthProps;
  onOutputUpdate: (output: OutputElement) => void;
}

export interface XtermMethods {
  focusTerminal: () => void;
  terminalWrite: (data: string) => void;
  getCurrentCommand: () => string;
  getTerminalSize: () => { width: number; height: number } | undefined;
  prompt: () => void;
  scrollBottom: () => void;
}

export interface MyResponse<T> {
  status: 200 | 400 | 401 | 403 | 404 | 500;
  data?: T | undefined;
  message: string | undefined;
  error: string[];
}

export interface EditorActivityState {
  content: string;
  language: string;
  isDirty: boolean;
}

export interface TreeViewActivityState {
  items: unknown[];
  selectedPath: string;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type ParsedLocation = {
  activityKey: ActivityType;
  contentKey?: string | null;
  groupKey?: string | null;
  clearParams?: boolean;
  skipTutorial?: boolean;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type GitHubRepository = {
  full_name: string;
  language?: string;
  description?: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  stargazers_count: number;
};

/**
 * Type guard for checking window existence
 */
export function isWindowDefined(): boolean {
  return typeof window !== 'undefined';
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignUpCredentials extends LoginCredentials {
  email: string;
}

export const TokenKeys = {
  AccessToken: 'AccessToken',
  RefreshToken: 'RefreshToken',
  IdToken: 'IdToken',
  ExpiresAt: 'ExpiresAt',
  ExpiresIn: 'ExpiresIn',
  GithubUsername: 'githubUsername'
} as const;
export type TokenKey = keyof typeof TokenKeys;

export interface AuthResponse {
  AccessToken: string;
  RefreshToken: string;
  IdToken: string;
  ExpiresAt?: string;
  ExpiresIn: number;
  githubUsername: string | undefined;
}

export interface IAuthProps {
  login: (username: string, password: string) => Promise<MyResponse<AuthResponse>>;
  signup: (credentials: SignUpCredentials) => Promise<MyResponse<unknown>>;
  verify: (username: string, code: string) => Promise<unknown>;
  refreshToken: () => Promise<MyResponse<AuthResponse>>;
  validateAndRefreshToken: () => Promise<MyResponse<AuthResponse>>;
  isLoggedIn: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isPending: boolean;
}

export interface IHandTermWrapperMethods {
  writeOutput: (output: string) => void;
  prompt: () => void;
  saveCommandResponseHistory: (command: string, response: string, status: number) => string;
  focusTerminal: () => void;
  handleCharacter: (character: string) => void;
  refreshComponent: () => void;
  setHeroSummersaultAction: () => void;
  setEditMode: (isEditMode: boolean) => void;
  handleEditSave: (content: string) => void;
  activityMediator?: {
    isInGameMode: boolean;
    isInTutorial: boolean;
    isInEdit: boolean;
    isInNormal: boolean;
    checkTutorialProgress: (command: string | null) => void;
    heroAction: ActionType;
    zombie4Action: ActionType;
    handleCommandExecuted: (parsedCommand: ParsedCommand) => boolean;
    setHeroAction: React.Dispatch<React.SetStateAction<ActionType>>;
    setZombie4Action: React.Dispatch<React.SetStateAction<ActionType>>;
    checkGameProgress: (successPhrase: GamePhrase) => void;
    setActivity: (activity: ActivityType) => void;
  }
}
import type * as monaco from 'monaco-editor';

export interface IStandaloneCodeEditor {
    dispose(): void;
    layout(dimension?: monaco.editor.IDimension): void;
    focus(): void;
    hasTextFocus(): boolean;
    trigger(source: string | null | undefined, handlerId: string, payload: any): void;
    changeViewZones(callback: (accessor: monaco.editor.IViewZoneChangeAccessor) => void): void;
    getVisibleRanges(): monaco.IRange[];
    getTopForLineNumber(lineNumber: number): number;
    getTopForPosition(lineNumber: number, column: number): number;
    getPosition(): monaco.IPosition | null;
    setPosition(position: monaco.IPosition): void;
    revealLine(lineNumber: number, scrollType?: monaco.editor.ScrollType): void;
    revealLineInCenter(lineNumber: number, scrollType?: monaco.editor.ScrollType): void;
    revealLineInCenterIfOutsideViewport(lineNumber: number, scrollType?: monaco.editor.ScrollType): void;
    revealPosition(position: monaco.IPosition, scrollType?: monaco.editor.ScrollType): void;
    revealPositionInCenter(position: monaco.IPosition, scrollType?: monaco.editor.ScrollType): void;
    revealPositionInCenterIfOutsideViewport(position: monaco.IPosition, scrollType?: monaco.editor.ScrollType): void;
    getSelection(): monaco.ISelection | null;
    getSelections(): readonly monaco.ISelection[] | null;
    setSelection(selection: monaco.IRange | monaco.ISelection): void;
    setSelections(selections: readonly monaco.ISelection[]): void;
    revealRange(range: monaco.IRange, scrollType?: monaco.editor.ScrollType): void;
    revealRangeInCenter(range: monaco.IRange, scrollType?: monaco.editor.ScrollType): void;
    revealRangeAtTop(range: monaco.IRange, scrollType?: monaco.editor.ScrollType): void;
    revealRangeInCenterIfOutsideViewport(range: monaco.IRange, scrollType?: monaco.editor.ScrollType): void;
    getModel(): monaco.editor.ITextModel | null;
    setModel(model: monaco.editor.ITextModel | null): void;
    onDidFocusEditorText(listener: () => void): monaco.IDisposable;
}

export const createMonacoEditor = (container: HTMLElement, options?: monaco.editor.IStandaloneEditorConstructionOptions): IStandaloneCodeEditor => {
    const disposable = monaco.editor.onDidCreateEditor((codeEditor) => {
        console.log('Editor created:', codeEditor);
    });
    return monaco.editor.create(container, options);
}
