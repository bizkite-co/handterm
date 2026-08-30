import type { IStandaloneCodeEditor } from 'monaco-editor';
import type { ActivityType, ParsedLocation } from '@handterm/types';
import type { Signal } from '@preact/signals-core';
import type { NavigationOptions } from 'src/utils/navigationUtils';

declare global {
  interface Window {
    monacoEditor: IStandaloneCodeEditor | null;
    appReady?: boolean;
    navigate: (options: ParsedLocation, navOptions?: boolean | NavigationOptions) => Promise<void>;
    completedTutorialsSignal: Signal<Set<string>>;
    commandLineSignal: Signal<string>;
    setActivity: (activity: ActivityType) => void;
    setCompletedTutorial: (key: string) => void;
    getNextTutorial: () => unknown;
    commandsRegistered?: boolean;
  }
}
