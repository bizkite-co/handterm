import { useCallback, useEffect, useRef, useState } from 'react';

import { useComputed } from '@preact/signals-react';

import { HandTermWrapper, type IHandTermWrapperMethods } from './components/HandTermWrapper';
import { ActivityMediatorProvider } from './contexts/ActivityMediatorContext';
import { AppProvider } from './contexts/AppContext';
import { CommandProvider } from './contexts/CommandProvider';
import { useAuth } from './hooks/useAuth';
import { bypassTutorialSignal } from './signals/appSignals';
import { TerminalCssClasses } from './types/TerminalTypes';
import { ActivityType } from './types/Types';
import { parseLocation } from './utils/navigationUtils';

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

  const handleOutputUpdate = () => {
    // Placeholder for future implementation
  };

  useEffect(() => {
    const w = getContainerWidth();
    setContainerWidth(w);

    const handleClickOutsideTerminal = (event: UIEvent) => {
      const currentRef = handexTermWrapperRef.current;
      if (currentRef === null) return;

      // Check if the click is outside of the terminal area
      if ((event.target as HTMLElement).id !== TerminalCssClasses.Terminal) {
        event.stopPropagation();
        currentRef.focusTerminal();

        if (
          event instanceof MouseEvent ||
          (event instanceof TouchEvent && event.touches.length === 1)
        ) {
          setTimeout(() => {
            if (handexTermWrapperRef.current !== null) {
              handexTermWrapperRef.current.focusTerminal();
            }
          }, 1000);
        }
      }
    };

    // Attach the event listener to the document body
    document.body.addEventListener('click', handleClickOutsideTerminal);
    document.body.addEventListener('touchstart', handleClickOutsideTerminal);

    // Clean up the event listener
    return () => {
      document.body.removeEventListener('click', handleClickOutsideTerminal);
      document.body.removeEventListener('touchstart', handleClickOutsideTerminal);
    };
  }, [getContainerWidth, handexTermWrapperRef]);

  return (
    <ActivityMediatorProvider>
      <div className='app' ref={containerRef}>
        <AppProvider>
          <CommandProvider
            auth={auth}
            handTermRef={handexTermWrapperRef}
          >
            {parseLocation().activityKey !== ActivityType.EDIT
              && <div />
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
              onOutputUpdate={handleOutputUpdate}
            />
          </CommandProvider>
        </AppProvider>
      </div>
    </ActivityMediatorProvider>
  );
}
