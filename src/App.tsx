import React, { useEffect, useRef, useCallback } from 'react';
import { ActivityType, OutputElement } from './types/Types';
import { HandTermWrapper, IHandTermWrapperMethods } from './components/HandTermWrapper';
import { TerminalCssClasses } from './types/TerminalTypes';
import { useAuth } from './hooks/useAuth';
import { Output } from './components/Output';
import { AppProvider } from './contexts/AppContext';
import { CommandProvider } from './contexts/CommandProvider';
import { ActivityMediatorProvider } from './contexts/ActivityMediatorContext';
import { useReactiveLocation } from './hooks/useReactiveLocation';
import { bypassTutorialSignal } from './signals/appSignals';
import { useComputed } from '@preact/signals-react';

export default function App() {
  const containerRef = React.createRef<HTMLDivElement>();
  const [_containerWidth, setContainerWidth] = React.useState<number>(0);

  const auth = useAuth();
  const handexTermWrapperRef = useRef<IHandTermWrapperMethods>(null);
  const { parseLocation } = useReactiveLocation();
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

  const handleOutputUpdate = (_newOutput: OutputElement) => {
    // Placeholder for future implementation
  };

  useEffect(() => {
    const w = getContainerWidth();
    setContainerWidth(w);

    const handleClickOutsideTerminal = (event: UIEvent) => {
      // Check if the click is outside of the terminal area
      if (
        handexTermWrapperRef.current &&
        (event.target as HTMLElement).id !== TerminalCssClasses.Terminal
      ) {
        event.stopPropagation();
        handexTermWrapperRef.current.focusTerminal();

        if (event instanceof MouseEvent || (event instanceof TouchEvent && event.touches.length === 1)) {
          setTimeout(() => {
            handexTermWrapperRef.current?.focusTerminal();
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
              terminalWidth={_containerWidth}
              onOutputUpdate={handleOutputUpdate}
            />
          </CommandProvider>
        </AppProvider>
      </div>
    </ActivityMediatorProvider>
  );
}
