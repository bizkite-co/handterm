import { type ReactNode } from "react";
import { ActivityType } from './runtimeConstants.js';
export type { Signal, ReadonlySignal } from './signal.js';
export * from './miscTypes.js';
export * from './runtimeConstants.js';
export * from './window.js';
export * from './TerminalTypes.js';

export interface GamePhrase {
  key: string;
  displayAs: string;
  value: string;
  tutorialGroup?: string;
}

export const Phrases: GamePhrase[] = [
  {
    value: 'The most important key is the Return (ENTER) key. Press the thumb tip and release. You\'ll use this key to enter every command.\n\nNOTE: Press enter to reset and redo any tutorial steps.',
    displayAs: 'Tutorial',
    key: '\r',
  },
  {
    value: 'Type `fdsa` & Enter. Notice that it requires only a finger-pinch and release for each character.',
    displayAs: 'Tutorial',
    key: 'fdsa',
  },
  {
    value: 'Type `jkl;`. Notice that it requires only a finger-grasp followed by a release.',
    displayAs: 'Tutorial',
    key: 'jkl;',
    tutorialGroup: 'single-click'
  },
  {
    key: "first-eight",
    displayAs: "Game",
    value: "all sad lads ask dad; alas fads fall",
    tutorialGroup: "single-click"
  },
  {
    value: 'Press the thumb tip followed by a finger tip to type numbers 0-4',
    displayAs: 'Tutorial',
    key: '01234'
  },
  {
    value: 'Press the thumb tip followed by a finger tip to type numbers 5-9',
    displayAs: 'Tutorial',
    key: '56789',
    tutorialGroup: 'numbers'
  },
  {
    key: "numbers",
    displayAs: "Game",
    value: "0123 4567 8901 2345 6789 0987",
    tutorialGroup: "numbers"
  },
  {
    value: 'Characters are only entered when the keys are released. For example, when you grasp the thumb and release it a space is entered.\n\nHowever, when you HOLD a grasp of your thumb it activates the shift key. Use Shift to type FDSA in uppercase letters. Remember to release your grip after each character.',
    displayAs: 'Tutorial',
    key: 'FDSA'
  },
  {
    value: 'These two characters complete the traditional home-row keys, but require two finger keystrokes similar to numbers. \n\nNotice that both actions start from the middle finger and end on the index finger. G uses 2 pinches. H uses 2 grasps, like their home-row counterparts.',
    displayAs: 'Tutorial',
    key: 'gh',
    tutorialGroup: 'home-row'
  },
  {
    key: "ask",
    displayAs: "Game",
    value: "All lads had flasks as glad gals ask halls; all had a glass",
    tutorialGroup: "home-row"
  },
  {
    key: "gallant",
    displayAs: "Game",
    value: "A gallant lad; a glass",
    tutorialGroup: "home-row"
  }
];

export const allTutorialKeys = Phrases
    .filter(t => t.displayAs === "Tutorial")
    .map(t => t.key);

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
}