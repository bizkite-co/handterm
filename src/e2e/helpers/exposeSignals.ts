import { commandLineSignal } from '../../signals/commandLineSignals';
import { setActivity } from '../../signals/appSignals'; // Import setActivity
import {
  setCompletedTutorial,
  getNextTutorial,
  setNextTutorial
} from '../../signals/tutorialSignals'; // Import tutorial functions

// Extend Window interface for the exposed functions
declare global {
  interface Window {
    commandLineSignal: typeof commandLineSignal;
    setActivity: typeof setActivity;
    setCompletedTutorial: typeof setCompletedTutorial;
    getNextTutorial: typeof getNextTutorial;
    setNextTutorial: typeof setNextTutorial;
  }
}

/**
 * Exposes signals and helper functions to the window object for e2e testing
 */
export function exposeSignals(): void {
  window.commandLineSignal = commandLineSignal;
  window.setActivity = setActivity;
  window.setCompletedTutorial = setCompletedTutorial;
  window.getNextTutorial = getNextTutorial;
  window.setNextTutorial = setNextTutorial;
}
