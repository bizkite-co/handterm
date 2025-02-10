import { useCallback, useEffect, useRef, useState } from 'react';

import { useComputed } from '@preact/signals-react';

import { HandTermWrapper, type IHandTermWrapperMethods } from './components/HandTermWrapper';
import { Output } from './components/Output';
import { ActivityMediatorProvider } from './contexts/ActivityMediatorContext';
import { AppProvider } from './contexts/AppContext';
import { CommandProvider } from './contexts/CommandProvider';
import { useAuth } from './hooks/useAuth';
import { bypassTutorialSignal } from './signals/appSignals';
import { ActivityType, TerminalCssClasses } from '@handterm/types';
import { parseLocation } from './utils/navigationUtils';

function isHandTermWrapperMethods(ref: React.RefObject<IHandTermWrapperMethods>): ref is React.RefObject<IHandTermWrapperMethods> & { current: IHandTermWrapperMethods } {
  return ref.current !== null && typeof ref.current.focusTerminal === 'function';
}

export function App(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const auth = useAuth();
  const handexTermWrapperRef = useRef<IHandTermWrapperMethods>(null);
  const isBypassActive = useComputed(() => bypassTutorialSignal.value);

  const getContainerWidth = useCallback(() => {
    return containerRef.current?.clientWidth ?? 0
  }, [containerRef]);

  useEffect(() => {
    const handleResize = () => {
      const w = getContainerWidth();
      setContainerWidth(w);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getContainerWidth]);

  useEffect(() => {
    const w = getContainerWidth();
    setContainerWidth(w);

    const handleOutsideTerminalClick = (event: MouseEvent | TouchEvent) => {
      const currentRef = handexTermWrapperRef.current;
      if (currentRef === null) return;

      // Check if the click is outside of the terminal area and if event.target is an HTMLElement
      if (event.target instanceof HTMLElement && event.target.id !== TerminalCssClasses.terminal) {
        event.stopPropagation();
        currentRef.focusTerminal();

        if (
          event instanceof MouseEvent ||
          (event instanceof TouchEvent && event.touches.length === 1)
        ) {
          setTimeout(() => {
            if (isHandTermWrapperMethods(handexTermWrapperRef)) {
              handexTermWrapperRef.current.focusTerminal();
            }
          }, 1000);
        }
      }
    };

    // Attach the event listener to the document body
    document.body.addEventListener('click', handleOutsideTerminalClick);
    document.body.addEventListener('touchstart', handleOutsideTerminalClick);

    // Clean up the event listener
    return () => {
      document.body.removeEventListener('click', handleOutsideTerminalClick);
      document.body.removeEventListener('touchstart', handleOutsideTerminalClick);
    };
  }, [getContainerWidth]);

  return (
    <ActivityMediatorProvider>
      <div className='app' ref={containerRef}>
        <AppProvider>
          <CommandProvider
            auth={auth}
            handTermRef={handexTermWrapperRef}
          >
            {parseLocation().activityKey !== ActivityType.EDIT
              && <Output />
            }
            {isBypassActive.value && (
              <div style={{ position: 'fixed', top: 0, right: 0, color: 'black', background: '#222', padding: '5px' }}>
                Bypass Mode Active
              </div>
            )}
            <HandTermWrapper
              ref={handexTermWrapperRef}
              auth={auth}
              terminalWidth={containerWidth}
              onOutputUpdate={() => {}}
            />
          </CommandProvider>
        </AppProvider>
      </div>
    </ActivityMediatorProvider>
  );
}
