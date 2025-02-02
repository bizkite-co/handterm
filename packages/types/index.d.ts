import { type ReactNode } from "react";

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

export class Chord implements IChord {
  key: string;
  chordCode: string;
  index: number;
  alias?: string;
  constructor(key: string, chordCode: string, index: number);
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

export { ActivityType, type ActivityTypeValues } from './src/runtimeConstants';

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

export { GamePhrase, Phrases } from './src/phrases';

/**
 * Type guard for checking window existence
 */
export function isWindowDefined(): boolean {
  return typeof window !== 'undefined';
}

// Auth Types
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

// HandTerm Types
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
}

/**
 * Signal-related window extensions
 */
export interface WindowExtensions {
  /** Monaco editor instance and types */
  monaco?: typeof import('monaco-editor');
  monacoEditor?: import('./monaco.js').IStandaloneCodeEditor;
  /** Activity signal for tracking current activity state */
  activitySignal: Signal<ActivityType>;
  /** Command line signal for handling commands */
  commandLineSignal: Signal<string>;
  /** Activity type enum for type safety */
  ActivityType: typeof ActivityType;
  /** Tutorial-related signals */
  tutorialSignals: TutorialSignals;
  /** Execute command function */
  executeCommand?: (command: string) => Promise<void>;
}

/**
 * Extend Window interface with signal functionality
 */
declare global {
  interface Window extends WindowExtensions {}
}

/**
 * Tutorial-related signals interface
 */
export interface TutorialSignals {
  /** Current tutorial step */
  currentStep: Signal<string>;
  /** Total number of tutorial steps */
  totalSteps: Signal<number>;
  /** Whether tutorial is completed */
  isCompleted: Signal<boolean>;
}

export interface OutputElement {
  command: ParsedCommand;
  response?: ReactNode;
  status: number;
  wpmAverage?: number;
  characterAverages?: ReadonlyArray<WPM>;
  commandTime: Date;
  component?: ReactNode; // New field for React components
  sensitive?: boolean; // Flag to indicate if the command contains sensitive data
}