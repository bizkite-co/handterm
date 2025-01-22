import type { Signal } from '@preact/signals-core';

interface Window {
  exposeSignals: () => void;
}

interface IStandaloneCodeEditor {
  getModel(): unknown;
  setModel(model: unknown): void;
  dispose(): void;
  getValue(): string;
  setValue(value: string): void;
  focus(): void;
  getPosition(): { lineNumber: number } | null;
}

import type { ActivityType } from '@handterm/types';

interface ActivityState {
  current: ActivityType;
  previous: ActivityType | null;
  transitionInProgress: boolean;
  tutorialCompleted: boolean;
}

interface TutorialSignals {
  currentStep: {
    value: number;
    set: (value: number) => void;
    subscribe: (callback: (value: number) => void) => void;
  };
  totalSteps: {
    value: number;
    set: (value: number) => void;
    subscribe: (callback: (value: number) => void) => void;
  };
  isComplete: {
    value: boolean;
    set: (value: boolean) => void;
    subscribe: (callback: (value: boolean) => void) => void;
  };
}

interface GitHubAPI {
  executeCommand: (command: string) => Promise<{
    status: 'success' | 'error';
    message: string;
  }>;
  getCredentials: () => Promise<{
    username: string;
    token: string;
  }>;
}

declare global {
  interface Window {
    signals: {
      activity: {
        value: ActivityType;
        set: (value: ActivityType) => void;
        subscribe: (callback: (value: ActivityType) => void) => void;
      };
      tutorial: {
        value: number;
        set: (value: number) => void;
        subscribe: (callback: (value: number) => void) => void;
      };
      commandLine: {
        value: string;
        set: (value: string) => void;
        subscribe: (callback: (value: string) => void) => void;
      };
    };
    activitySignal: Signal<ActivityState>;
    tutorialSignals: TutorialSignals;
    commandLineSignal: {
      value: string;
      set: (value: string) => void;
      subscribe: (callback: (value: string) => void) => void;
    };
    monaco: {
      editor: {
        create: () => IStandaloneCodeEditor;
        setModelLanguage: (model: unknown, language: string) => void;
        defineTheme: (name: string, theme: unknown) => void;
        setValue: (value: string) => void;
        getValue: () => string;
        focus: () => void;
        getPosition: () => { lineNumber: number } | null;
      };
    };
    github: GitHubAPI;
    localStorage: Storage;
    setActivity: (activity: string) => void;
    setNextTutorial: () => void;
    initializeTestEnvironment: () => void;
    ActivityType: Record<string, string>;
    executeCommand: (command: string) => Promise<void>;
  }
}
