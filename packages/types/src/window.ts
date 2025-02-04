import type { ActivityType } from './runtimeConstants.js';
import type { Signal } from '@preact/signals-core';

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
 * Window extensions for testing
 */
export interface WindowExtensions {
  /** Monaco editor instance and types */
  monaco?: typeof import('monaco-editor');
  monacoEditor?: import('./monaco.js').IStandaloneCodeEditor;
  /** Activity type enum for type safety */
  ActivityType: typeof ActivityType;
  /** Set activity function */
  setActivity: (activity: ActivityType) => void;
  /** Execute command function */
  executeCommand?: (command: string) => Promise<void>;
  /** GitHub utilities */
  githubUtils?: {
    getCredentials: () => Promise<{ token: string; username: string }>;
    getTree: () => Promise<{ tree: Array<{ path: string; type: string }> }>;
    getRepoInfo: () => Promise<{ owner: string; repo: string }>;
  };
  /** Signal properties */
  activityStateSignal: Signal<ActivityState>;
  commandLineSignal: Signal<string>;
  tutorialSignals: TutorialSignals;
}