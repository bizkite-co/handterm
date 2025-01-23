import { commandLineSignal } from '../signals/commandLineSignals';
import { SignalBase } from '../signals/base/SignalBase';
import { activityState } from '../utils/activityState';
import {
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
      brand = Symbol('activitySignal');
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
      brand = Symbol('tutorialSignals');
      value = null;

      currentStep = new class extends SignalBase<string> {
        type = 'tutorialStep';
        brand = Symbol('tutorialStep');
        value = '0';

        subscribe(callback: (value: string) => void): () => void {
          this.subscribers.add(callback);
          return () => this.subscribers.delete(callback);
        }
      };

      totalSteps = new class extends SignalBase<number> {
        type = 'tutorialTotalSteps';
        brand = Symbol('tutorialTotalSteps');
        value = GamePhrases.getGamePhrasesByTutorialGroup('tutorial').length;

        subscribe(callback: (value: number) => void): () => void {
          this.subscribers.add(callback);
          return () => this.subscribers.delete(callback);
        }
      };

      isCompleted = new class extends SignalBase<boolean> {
        type = 'tutorialCompleted';
        brand = Symbol('tutorialCompleted');
        value = false;

        subscribe(callback: (value: boolean) => void): () => void {
          this.subscribers.add(callback);
          return () => this.subscribers.delete(callback);
        }
      };

      subscribe(): () => void {
        throw new Error('Method not implemented.');
      }
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
