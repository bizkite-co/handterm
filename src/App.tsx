import { useCallback, useEffect, useRef, useState } from 'react';

import { HandTermWrapper } from './components/HandTermWrapper';
import { Output } from './components/Output';
import { ActivityMediatorProvider } from './contexts/ActivityMediatorContext';
import { AppProvider } from './contexts/AppContext';
import { CommandProvider } from './contexts/CommandProvider';
import { useAuth } from './hooks/useAuth';
import { ActivityType, TerminalCssClasses, type IHandTermWrapperMethods } from '@handterm/types';
import { parseLocation } from './utils/navigationUtils';
import { WebContainer } from '@webcontainer/api';

function isHandTermWrapperMethods(ref: React.RefObject<IHandTermWrapperMethods>): ref is React.RefObject<IHandTermWrapperMethods> & { current: IHandTermWrapperMethods } {
  return ref.current !== null && typeof ref.current.focusTerminal === 'function';
}

export function App(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const auth = useAuth();
  const handexTermWrapperRef = useRef<IHandTermWrapperMethods>(null);
  const [webcontainerInstance, setWebcontainerInstance] = useState<WebContainer | null>(null);

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

  const handleWebContainerInit = useCallback((webcontainer: WebContainer) => {
    setWebcontainerInstance(webcontainer);
  }, []);

  return (
    <ActivityMediatorProvider>
      <div className='app' ref={containerRef}>
        <AppProvider>
          <CommandProvider
            auth={auth}
            handTermRef={handexTermWrapperRef}
            webcontainerInstance={webcontainerInstance}
          >
            {parseLocation().activityKey !== ActivityType.EDIT
              && <Output />
            }
            <HandTermWrapper
              ref={handexTermWrapperRef}
              auth={auth}
              terminalWidth={containerWidth}
              onOutputUpdate={() => {}}
              onWebContainerInit={handleWebContainerInit}
            />
          </CommandProvider>
        </AppProvider>
      </div>
    </ActivityMediatorProvider>
  );
}
