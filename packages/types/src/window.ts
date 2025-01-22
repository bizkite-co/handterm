import type { Signal } from './signal';
import type { ActivityType } from './activity';

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

/**
 * Signal-related window extensions
 */
export interface WindowExtensions {
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
 * Type guard for checking window existence
 */
export function isWindowDefined(): boolean {
  return typeof window !== 'undefined';
}