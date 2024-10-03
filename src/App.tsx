// App.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { HandTermWrapper } from './components/HandTermWrapper';
import { TerminalCssClasses } from './types/TerminalTypes';
import { useAuth } from './lib/useAuth';
import { Output } from './components/Output';
import { IHandTermMethods } from './components/HandTerm';
import { XtermAdapterMethods } from './components/XtermAdapter';

const MemoizedOutput = React.memo(Output);

const App = () => {
  const containerRef = React.createRef<HTMLDivElement>();
  const [containerWidth, setContainerWidth] = React.useState<number>(0);
  const handexTermWrapperRef = useRef<IHandTermMethods>(null);
  const auth = useAuth();
  const [outputElements, setOutputElements] = useState<React.ReactNode[]>([]);
  const adapterRef = useRef<XtermAdapterMethods>(null);
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
  }, []);

  const getContainerWidth = () => {
    return containerRef.current?.clientWidth ?? 0
  }

  useEffect(() => {
    const handleResize = () => {
      const w = getContainerWidth();
      setContainerWidth(w);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleOutputUpdate = useCallback((newOutput: React.ReactNode) => {
    setOutputElements(_prevOutputs => [newOutput]);
  }, []);

  const handleTouchStart = useCallback(() => {
    // Implement your touch start logic here
    console.log("handling touch start");
  }, []);

  const handleTouchEnd = useCallback(() => {
    // Implement your touch end logic here
    console.log("Handling touch end");
  }, []);

  return (
    <>
      <div ref={containerRef}>
        <MemoizedOutput
          elements={outputElements}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />
        <HandTermWrapper
          ref={handexTermWrapperRef}
          adapterRef={adapterRef}
          auth={auth}
          terminalWidth={containerWidth}
          onOutputUpdate={handleOutputUpdate}
        />
      </div>
    </>
  );
};

export default App;
