/**
 * Test Signal Management
 *
 * This module exposes signals for testing that mirror the application's signal behavior.
 * It uses createPersistentSignal to maintain consistency with how the app manages state.
 *
 * To set up test state:
 * 1. Use updateCompletedTutorials to set initial completed tutorials
 * 2. Use setNextTutorial to set the current tutorial
 * 3. Use setActivity to set the current activity
 *
 * Example:
 * ```ts
 * // Set up state for fdsa tutorial test
 * updateCompletedTutorials(new Set(['\\r']));
 * setNextTutorial(Phrases.find(p => p.key === 'fdsa') ?? null);
 * setActivity(ActivityType.TUTORIAL);
 * ```
 */

import { signal } from '@preact/signals-core';
import { commandLineSignal } from '../signals/commandLineSignals';
import { activityState } from '../utils/activityState';
import { createPersistentSignal } from '../utils/signalPersistence';
import {
  type WindowExtensions,
  ActivityType,
  isWindowDefined,
  Phrases,
  type GamePhrase
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

  const requiredProperties = [
    'activityStateSignal',
    'commandLineSignal',
    'tutorialSignals',
    'ActivityType',
    'setActivity',
    'tutorialSignal',
    'completedTutorialsSignal',
    'setNextTutorial',
    'getNextTutorial',
    'setCompletedTutorial',
    'updateCompletedTutorials',
    'Phrases'
  ] as const;

  const isValid = typeof win === 'object' &&
    win !== null &&
    isWindowDefined() &&
    requiredProperties.every(prop => prop in winWithSignals);

  if (!isValid) {
    console.error('Window signals validation failed:',
      Object.fromEntries(
        requiredProperties.map(prop => [prop, prop in winWithSignals])
      )
    );
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

    // Create tutorial signals using persistent storage
    const { signal: completedTutorialsSignal, update: updateCompletedTutorials } = createPersistentSignal({
      key: 'completed-tutorials',
      signal: signal<Set<string>>(new Set()),
      serialize: (value) => JSON.stringify([...value]),
      deserialize: (value) => new Set(JSON.parse(value) as string[]),
    });

    const tutorialSignal = signal<GamePhrase | null>(null);
    const tutorialSignals = {
      currentStep: signal(0),
      totalSteps: signal(Phrases.filter(p => p.displayAs === 'Tutorial').length),
      isComplete: signal(false)
    };

    // Initialize with empty state
    updateCompletedTutorials(new Set());

    // Create tutorial functions
    const getNextTutorial = (): GamePhrase | null => {
      const nextTutorial = Phrases
        .filter(t => t.displayAs === "Tutorial")
        .find(t => !completedTutorialsSignal.value.has(t.key));
      return nextTutorial ?? null;
    };

    const setCompletedTutorial = (tutorialKey: string): void => {
      completedTutorialsSignal.value = new Set([...completedTutorialsSignal.value, tutorialKey]);
      const nextTutorial = getNextTutorial();
      tutorialSignal.value = nextTutorial;
    };

    // Initialize window properties with proper descriptors
    const signalsToAttach = {
      activityStateSignal,
      commandLineSignal,
      ActivityType,
      tutorialSignals,
      tutorialSignal,
      completedTutorialsSignal,
      Phrases,
      setNextTutorial: (tutorial: GamePhrase | null) => {
        tutorialSignal.value = tutorial;
      },
      getNextTutorial,
      setCompletedTutorial,
      updateCompletedTutorials,
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
