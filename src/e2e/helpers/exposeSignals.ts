import { commandLineSignal } from '../../signals/commandLineSignals';
import { setActivity } from '../../signals/appSignals'; // Import setActivity
import {
  setCompletedTutorial,
  getNextTutorial,
  setNextTutorial
} from '../../signals/tutorialSignals'; // Import tutorial functions
// Removed import of commandRegistry

// REMOVED declare global block - types are now in packages/types/src/window.ts

/**
 * Exposes signals and helper functions to the window object for e2e testing
 */
export function exposeSignals(): void {
  window.commandLineSignal = commandLineSignal;
  window.setActivity = setActivity;
  window.setCompletedTutorial = setCompletedTutorial;
  window.getNextTutorial = getNextTutorial;
  window.setNextTutorial = setNextTutorial;
  // Removed exposure of commandRegistry
}
