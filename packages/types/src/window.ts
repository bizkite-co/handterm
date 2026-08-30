import type { ActivityType } from './runtimeConstants.js';
import type { Signal } from '@preact/signals-core';
import type { GamePhrase } from './index.js'; // Already imports GamePhrase
import type { IStandaloneCodeEditor } from './monaco.js';
// Assuming HandTermCurrent is defined elsewhere or needs import
// import type { HandTermCurrent } from './path/to/HandTermCurrent'; // Placeholder import

// Define logger type structure if not imported
type LoggerFunction = (...args: unknown[]) => void;
interface Logger {
  debug: LoggerFunction;
  info: LoggerFunction;
  warn: LoggerFunction;
  error: LoggerFunction;
}

export interface TutorialSignals {
  currentStep: Signal<number>;
  totalSteps: Signal<number>;
  isComplete: Signal<boolean>;
}

export interface ActivityState {
  current: ActivityType;
  previous: ActivityType | null;
  transitionInProgress: boolean;
  tutorialCompleted: boolean;
}

/**
 * Consolidated Window extensions for application and E2E testing
 */
export interface WindowExtensions {
  // Monaco Editor
  monaco?: typeof import('monaco-editor');
  monacoEditor?: IStandaloneCodeEditor;

  // Core App State & Functions (Potentially exposed for testing)
  ActivityType: typeof ActivityType;
  setActivity: (activity: ActivityType) => void;
  activityStateSignal: Signal<ActivityState>;
  commandLineSignal: Signal<string>;

  // Tutorial State & Functions (Potentially exposed for testing)
  tutorialSignals: TutorialSignals;
  tutorialSignal: Signal<GamePhrase | null>;
  completedTutorialsSignal: Signal<Set<string>>;
  setNextTutorial: (tutorial: string | null) => void;
  getNextTutorial: () => GamePhrase | null;
  setCompletedTutorial: (tutorialKey: string) => void;
  updateCompletedTutorials: (value: Set<string>) => void; // Keep if used

  // Game State & Data (Potentially exposed for testing)
  Phrases: GamePhrase[];

  // E2E / Test Specific Functions & Utilities
  executeCommand: ((command: string) => Promise<void>) | undefined; // Union type
  // Explicitly allow undefined for githubUtils
  githubUtils?: {
    getCredentials: () => Promise<{ token: string; username: string }>;
    getTree: () => Promise<{ tree: Array<{ path: string; type: string }> }>;
    getRepoInfo: () => Promise<{ owner: string; repo: string }>;
  } | undefined;
  exposeSignals?: () => void; // From playwright.d.ts
  createLogger?: (options: { prefix: string }) => Logger; // From setupWindow.ts
  __xtermDataCallback?: ((data: string) => void) | undefined; // From setup.ts
  // _handTerm?: HandTermCurrent; // From archiveCommand.ts - Uncomment if HandTermCurrent type is available

  // Deprecated/Old Test Utilities (Keep if still referenced somewhere)
  testFunction?: () => string; // Make optional if deprecated
}