import { commandLineSignal } from '../../signals/commandLineSignals';

/**
 * Exposes signals to the window object for e2e testing
 */
export function exposeSignals(): void {
    (window as unknown as { commandLineSignal: typeof commandLineSignal }).commandLineSignal = commandLineSignal;
}
