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
  code: string;
  signalName: string;
}

let isInitialized = false;

/**
 * Type guard for window with our extensions
 */
function isWindowWithSignals(win: unknown): win is Window & WindowExtensions {
  // Enhanced type checking with runtime validation
  const isValid = typeof win === 'object' &&
    win !== null &&
    isWindowDefined() &&
    'activitySignal' in win &&
    typeof (win as WindowExtensions).activitySignal?.peek === 'function' &&
    typeof (win as WindowExtensions).activitySignal?.subscribe === 'function' &&
    'commandLineSignal' in win &&
    'tutorialSignals' in win;

  if (!isValid) {
    console.error('Window signals validation failed:', {
      activitySignal: (win as WindowExtensions).activitySignal,
      commandLineSignal: (win as WindowExtensions).commandLineSignal,
      tutorialSignals: (win as WindowExtensions).tutorialSignals
    });
  }

  return isValid;
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
    error.signalName = options.name;
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
    const isSignalError = (e: unknown): e is SignalError =>
      typeof e === 'object' &&
      e !== null &&
      'code' in e &&
      'signalName' in e;

    const errorMessage = isSignalError(error)
      ? error.message || 'Unknown error'
      : 'Unknown error';
    const errorCode = isSignalError(error)
      ? error.code || 'UNKNOWN_ERROR'
      : 'UNKNOWN_ERROR';

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
  if (isInitialized) {
    return;
  }

  try {
    // Create activity signal
    const activitySignal = new class extends SignalBase<ActivityType> {
      type = 'activity';
      get value(): ActivityType {
        return activityState.value.current;
      }
      set value(v: ActivityType) {
        activityState.value = { ...activityState.value, current: v };
        this.notifySubscribers();
      }

      subscribe(callback: (value: ActivityType) => void): () => void {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
      }
    };

    // Create tutorial signals
    const tutorialSignals = new class extends SignalBase<unknown> implements TutorialSignals {
      type = 'tutorial';
      value = null;

      currentStep = new class extends SignalBase<string> {
        type = 'tutorialStep';
        value = '0';

        subscribe(callback: (value: string) => void): () => void {
          this.subscribers.add(callback);
          return () => this.subscribers.delete(callback);
        }
      };

      totalSteps = new class extends SignalBase<number> {
        type = 'tutorialTotalSteps';
        value = GamePhrases.getGamePhrasesByTutorialGroup('tutorial').length;

        subscribe(callback: (value: number) => void): () => void {
          this.subscribers.add(callback);
          return () => this.subscribers.delete(callback);
        }
      };

      isCompleted = new class extends SignalBase<boolean> {
        type = 'tutorialCompleted';
        value = false;

        subscribe(callback: (value: boolean) => void): () => void {
          this.subscribers.add(callback);
          return () => this.subscribers.delete(callback);
        }
      };

      subscribe(): () => void {
        throw new Error('Method not implemented.');
      }
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

    // Initialize window properties with proper descriptors
    const signalsToAttach = {
      activitySignal,
      commandLineSignal,
      ActivityType,
      tutorialSignals,
      executeCommand: async (command: string): Promise<void> => {
        console.log('[exposeSignals] Executing command:', command);
        commandLineSignal.value = command;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    };

    console.log('[exposeSignals] Attaching signals:', {
      activitySignal: !!signalsToAttach.activitySignal,
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
