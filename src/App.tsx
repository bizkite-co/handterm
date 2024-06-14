// App.tsx
import React, { useEffect, useRef } from 'react';
import HandTerm from './components/HandTerm';
import { CommandProvider } from './commands/CommandProvider';

const App = () => {
  const containerRef = React.createRef<HTMLDivElement>();
  const [containerWidth, setContainerWidth] = React.useState<number>(0);
  const handexTermRef = useRef<HandTerm>(null);

  useEffect(() => {
    const w = getContainerWidth();
    setContainerWidth(w);
   const handleClickOutsideTerminal = (event: MouseEvent) => {
      // Check if the click is outside of the terminal area
     if (
        handexTermRef.current &&
        handexTermRef.current.adapterRef.current &&
        handexTermRef.current.adapterRef.current.terminalRef.current &&
        handexTermRef.current.adapterRef.current.terminalRef.current
      ) {
          handexTermRef.current.adapterRef.current.terminalRef.current.focus();
      }
    };

    // Attach the event listener to the document body
    document.body.addEventListener('click', handleClickOutsideTerminal);

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