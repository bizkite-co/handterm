// App.tsx
import React, { useEffect, useRef } from 'react';
import HandTerm from './components/HandTerm';
import { CommandProvider } from './commands/CommandProvider';
import { TerminalCssClasses } from './types/TerminalTypes';

const App = () => {
  const containerRef = React.createRef<HTMLDivElement>();
  const [containerWidth, setContainerWidth] = React.useState<number>(0);
  const handexTermRef = useRef<HandTerm>(null);

  useEffect(() => {
    const w = getContainerWidth();
    setContainerWidth(w);

    const handleClickOutsideTerminal = (event: UIEvent) => {
      // Check if the click is outside of the terminal area

      if (
        handexTermRef.current &&
        handexTermRef.current.adapterRef.current
        && (event.target as HTMLElement).id !== TerminalCssClasses.Terminal
      ) {
        event.stopPropagation();
        window.scrollTo(0, window.screen.height)
        handexTermRef.current.adapterRef.current.focusTerminal();

        if (event instanceof MouseEvent || (event instanceof TouchEvent && event.touches.length === 1)) {
          handexTermRef.current.adapterRef.current.focusTerminal();

          setTimeout(() => {
            if (
              handexTermRef.current &&
              handexTermRef.current.adapterRef.current
            ) handexTermRef.current.adapterRef.current.focusTerminal();
          }, 1000);
          // type a character to trigger the focus event
          // handexTermRef.current.adapterRef.current.terminalWrite('a');
        }
      }
    };

    // Attach the event listener to the document body
    document.body.addEventListener('click', handleClickOutsideTerminal);
    document.body.addEventListener('touchstart', handleClickOutsideTerminal);

    // Clean up the event listener
    return () => {
      document.body.removeEventListener('click', handleClickOutsideTerminal);
    };
  }, [])

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
  })

  return (
    <CommandProvider handTermRef={handexTermRef}>
      <div ref={containerRef}>
        <HandTerm
          ref={handexTermRef}
          terminalWidth={containerWidth}
        />
      </div>
    </CommandProvider>
  );
};

export default App;