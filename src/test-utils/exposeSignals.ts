import { commandLineSignal } from '../signals/commandLineSignals';
import { activityState } from '../utils/activityState';
import { tutorialSignal } from '../signals/tutorialSignals';
import {
  type Signal,
  type SignalOptions,
  createSignal,
  isSignal,
  type WindowExtensions,
  type TutorialSignals,
  ActivityType,
  isWindowDefined
} from '@handterm/types';
import GamePhrases from '../utils/GamePhrases';

interface SignalError extends Error {
  code?: string;
  signalName?: string;
}

/**
 * Type guard for window with our extensions
 */
function isWindowWithSignals(win: unknown): win is Window & WindowExtensions {
  return typeof win === 'object' &&
         win !== null &&
         isWindowDefined() &&
         'activitySignal' in win;
}

// Ensure window exists and has signal extensions
if (!isWindowWithSignals(window)) {
  const error = new Error('Window is not properly initialized') as SignalError;
  error.code = 'WINDOW_NOT_INITIALIZED';
  throw error;
}

/**
 * Create a signal with proper error handling and type safety
 */
function createSafeSignal<T>(options: SignalOptions<T>): Signal<T> {
  if (!options || typeof options !== 'object') {
    const error = new Error('Invalid signal options') as SignalError;
    error.code = 'INVALID_OPTIONS';
    throw error;
  }

  if (typeof options.name !== 'string' || !options.name) {
    const error = new Error('Signal options must include a name') as SignalError;
    error.code = 'MISSING_NAME';
    error.signalName = String(options.name);
    throw error;
  }

  try {
    const signal = createSignal<T>(options);
    if (!isSignal<T>(signal)) {
      const error = new Error(`Invalid signal created for ${options.name}`) as SignalError;
      error.code = 'INVALID_SIGNAL';
      error.signalName = options.name;
      throw error;
    }
    return signal;
  } catch (error: unknown) {
    const signalError = error as SignalError;
    const errorMessage = signalError.message || 'Unknown error';
    const errorCode = signalError.code || 'UNKNOWN_ERROR';

    console.error(`[exposeSignals] Failed to create signal ${options.name}:`, {
      message: errorMessage,
      code: errorCode,
      name: options.name
    });

    const wrappedError = new Error(`Failed to create signal ${options.name}: ${errorMessage}`) as SignalError;
    wrappedError.code = errorCode;
    wrappedError.signalName = options.name;
    throw wrappedError;
  }
}

/**
 * Initialize window signals and properties
 */
function initializeWindow(): void {
  try {
    // Create activity signal
    const activitySignal = createSafeSignal<ActivityType>({
      name: 'activitySignal',
      value: () => activityState.value.current,
      setValue: (v: ActivityType) => {
        activityState.value = { ...activityState.value, current: v };
      },
      subscribe: (callback: (value: ActivityType) => void) => {
        console.log('[exposeSignals] Subscribing to activitySignal');
        return activityState.subscribe((state) => callback(state.current));
      }
    });

    // Create tutorial signals
    const tutorialSignals: TutorialSignals = {
      currentStep: createSafeSignal<string>({
        name: 'tutorialSignal.currentStep',
        value: '0',
        setValue: (value: string) => {
          try {
            const phrase = GamePhrases.getGamePhraseByKey(value);
            if (phrase) {
              tutorialSignal.value = phrase;
            }
          } catch (error) {
            console.error('[exposeSignals] Failed to set tutorial step:', error);
          }
        },
        subscribe: (callback: (value: string) => void) => tutorialSignal.subscribe((phrase) => {
          if (phrase) {
            callback(phrase.key);
          }
        })
      }),
      totalSteps: createSafeSignal<number>({
        name: 'tutorialSignal.totalSteps',
        value: () => GamePhrases.getGamePhrasesByTutorialGroup('tutorial').length,
        setValue: () => {
          console.warn('[exposeSignals] Attempted to set read-only totalSteps signal');
        }
      }),
      isCompleted: createSafeSignal<boolean>({
        name: 'tutorialSignal.isCompleted',
        value: () => tutorialSignal.peek() === null,
        setValue: (value: boolean) => {
          try {
            if (value) {
              tutorialSignal.value = null;
            }
          } catch (error) {
            console.error('[exposeSignals] Failed to set tutorial completion:', error);
          }
        }
      })
    };

    // Initialize window properties
    Object.assign(window, {
      activitySignal,
      commandLineSignal,
      ActivityType,
      tutorialSignals,
      executeCommand: async (command: string): Promise<void> => {
        console.log('[exposeSignals] Executing command:', command);
        commandLineSignal.value = command;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    });

    console.log('[exposeSignals] Signals exposed');
  } catch (error) {
    console.error('[exposeSignals] Failed to initialize window:', error);
    throw error;
  }
}

// Initialize window
initializeWindow();
