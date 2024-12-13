import { commandLineSignal } from '../../signals/commandLineSignals';

/**
 * Exposes signals to the window object for e2e testing
 */
export function exposeSignals() {
    (window as { commandLineSignal: typeof commandLineSignal }).commandLineSignal = commandLineSignal;
}
