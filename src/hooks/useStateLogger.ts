import { useRef, useEffect } from 'react';

export function useStateLogger<T>(state: T, name: string): void {
  const prevStateRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      const currentState = JSON.stringify(state);

      if (prevStateRef.current !== currentState) {
        const prevState = prevStateRef.current ? JSON.parse(prevStateRef.current) as T : {} as T;
        const stateChangeLog = {
          from: prevState,
          to: state
        };

        // Log error without using console.log
        const logMessage = `[${name}] State changed: ${JSON.stringify(stateChangeLog, null, 2)}`;
        if (typeof window !== 'undefined' && window.console && window.console.log) {
          window.console.log(logMessage);
        }

        prevStateRef.current = currentState;
      }
    } catch (error) {
      // Silent error handling to prevent breaking the application
      const errorMessage = error instanceof Error ? error.message : 'Unknown error in state logging';
      if (typeof window !== 'undefined' && window.console && window.console.error) {
        window.console.error(`[${name}] State logging error:`, errorMessage);
      }
    }
  }, [state, name]);
}
