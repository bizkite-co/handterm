import { useRef, useEffect } from 'react';

export const useStateLogger = (state: any, name: string) => {
  const prevStateRef = useRef<any>(null);

  useEffect(() => {
    const prevState = prevStateRef.current;
    const currentState = JSON.stringify(state);

    if (prevState !== currentState) {
      console.log(`[${name}] State changed: ${JSON.stringify({
        from: JSON.parse(prevState || '{}'),
        to: currentState ? JSON.parse(currentState) : 'undefined',
      }, null, 2)}`);

      prevStateRef.current = currentState;
    }
  }, [state, name]);
};
