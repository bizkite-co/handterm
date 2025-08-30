import React, { useCallback, useEffect, useRef, useState, type RefObject } from 'react'; // Explicitly import React and RefObject

import { HandTermWrapper } from './components/HandTermWrapper';
import { Output } from './components/Output';
import { ActivityMediatorProvider } from './contexts/ActivityMediatorContext';
import { AppProvider } from './contexts/AppContext';
import { CommandProvider } from './contexts/CommandProvider';
import { useAuth } from './hooks/useAuth';
import { ActivityType, TerminalCssClasses, type IHandTermWrapperMethods } from '@handterm/types';
import { parseLocation, navigate } from './utils/navigationUtils'; // Import navigate
import { createLogger } from './utils/Logger'; // Import logger
import ErrorBoundary from './components/ErrorBoundary'; // Import ErrorBoundary

const logger = createLogger({ prefix: 'App' }); // Create logger instance

// Adjusted type guard to accept potentially null ref current
function isHandTermWrapperMethods(ref: RefObject<IHandTermWrapperMethods | null>): ref is RefObject<IHandTermWrapperMethods> & { current: IHandTermWrapperMethods } {
  return ref.current !== null && typeof ref.current.focusTerminal === 'function';
}

// ENHANCED: Remove explicit JSX.Element return type annotation
export function App() {
// END ENHANCED
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const auth = useAuth();
  const handexTermWrapperRef = useRef<IHandTermWrapperMethods>(null); // Type remains IHandTermWrapperMethods | null

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
    const handleOutsideTerminalClick = (event: MouseEvent | TouchEvent) => {
      // No change needed here, guard handles the check
      const currentRef = handexTermWrapperRef.current;
      if (currentRef === null) return;

      // Check if the click is outside of the terminal area and if event.target is an HTMLElement
      if (event.target instanceof HTMLElement && event.target.id !== TerminalCssClasses.terminal) {
        event.stopPropagation();
        currentRef.focusTerminal(); // Already know currentRef is not null here

        if (
          event instanceof MouseEvent ||
          (event instanceof TouchEvent && event.touches.length === 1)
        ) {
          setTimeout(() => {
            // Use the type guard here before accessing current
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

  // ADDED: Effect to signal app readiness for Playwright
  useEffect(() => {
    logger.debug('App component mounted, signaling appReady.');
    (window as any).appReady = true;
  }, []); // Empty dependency array ensures this runs only once after initial mount

  // Expose navigate function for Playwright tests (unconditionally)
  (window as any).navigate = navigate;

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
            {/* ENHANCED: Wrap HandTermWrapper with ErrorBoundary */}
            <ErrorBoundary>
              <HandTermWrapper
                ref={handexTermWrapperRef}
                auth={auth}
                terminalWidth={containerWidth}
                onOutputUpdate={() => {}}
              />
            </ErrorBoundary>
            {/* END ENHANCED */}
          </CommandProvider>
        </AppProvider>
      </div>
    </ActivityMediatorProvider>
  );
}
