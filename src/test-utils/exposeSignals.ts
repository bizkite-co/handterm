import { signal } from '@preact/signals-core';
import { commandLineSignal } from '../signals/commandLineSignals';
import { activityState } from '../utils/activityState';
import {
  type WindowExtensions,
  ActivityType,
  isWindowDefined,
  Phrases
} from '@handterm/types';

interface SignalError extends Error {
  code: string;
  signalName: string;
}

let isInitialized = false;

/**
 * Type guard for window with our extensions
 */
function isWindowWithSignals(win: unknown): win is Window & WindowExtensions {
  // Enhanced type checking with runtime validation
  const winWithSignals = win as Window & Partial<WindowExtensions>;

  const isValid = typeof win === 'object' &&
    win !== null &&
    isWindowDefined() &&
    'activityStateSignal' in winWithSignals &&
    'commandLineSignal' in winWithSignals &&
    'tutorialSignals' in winWithSignals &&
    'ActivityType' in winWithSignals &&
    'setActivity' in winWithSignals;

  if (!isValid) {
    console.error('Window signals validation failed:', {
      activityStateSignal: 'activityStateSignal' in winWithSignals,
      commandLineSignal: 'commandLineSignal' in winWithSignals,
      tutorialSignals: 'tutorialSignals' in winWithSignals,
      ActivityType: 'ActivityType' in winWithSignals,
      setActivity: 'setActivity' in winWithSignals
    });
  }

  return isValid;
}

/**
 * Initialize window signals and properties
 */
function initializeWindow(): void {
  if (isInitialized) {
    return;
  }

  try {
    // Create activity signal using @preact/signals-core
    const activityStateSignal = signal(activityState.value);

    // Create tutorial signals using @preact/signals-core
    const tutorialSignals = {
      currentStep: signal(0),
      totalSteps: signal(Phrases.filter(p => p.displayAs === 'Tutorial').length),
      isComplete: signal(false)
    };

    // Initialize window properties with proper descriptors
    const signalsToAttach = {
      activityStateSignal,
      commandLineSignal,
      ActivityType,
      tutorialSignals,
      setActivity: (activity: ActivityType) => {
        const currentState = activityStateSignal.value;
        activityStateSignal.value = {
          current: activity,
          previous: currentState.current,
          transitionInProgress: false,
          tutorialCompleted: currentState.tutorialCompleted
        };
      },
      executeCommand: async (command: string): Promise<void> => {
        console.log('[exposeSignals] Executing command:', command);
        commandLineSignal.value = command;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    };

    console.log('[exposeSignals] Attaching signals:', {
      activityStateSignal: !!signalsToAttach.activityStateSignal,
      commandLineSignal: !!signalsToAttach.commandLineSignal,
      tutorialSignals: !!signalsToAttach.tutorialSignals
    });

    // Use defineProperty to ensure writability
    Object.keys(signalsToAttach).forEach(key => {
      Object.defineProperty(window, key, {
        value: signalsToAttach[key as keyof typeof signalsToAttach],
        writable: true,
        configurable: true
      });
    });

    isInitialized = true;
    console.log('[exposeSignals] Signals exposed');
  } catch (error) {
    console.error('[exposeSignals] Failed to initialize window:', error);
    throw error;
  }
}

/**
 * Verify window is properly initialized
 */
export function verifyWindowInitialization(): void {
  if (!isWindowWithSignals(window)) {
    const error = new Error('Window is not properly initialized') as SignalError;
    error.code = 'WINDOW_NOT_INITIALIZED';
    throw error;
  }
}

export const exposeSignals = initializeWindow;
