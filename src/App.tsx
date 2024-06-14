// App.tsx
import React, { useEffect, useRef } from 'react';
import HandexTerm from './components/HandTerm';
import { CommandProvider } from './commands/CommandProvider';

const App = () => {
  const containerRef = React.createRef<HTMLDivElement>();
  const [containerWidth, setContainerWidth] = React.useState<number>(0);
  const terminalRef = useRef<HTMLDivElement>(null); // Assuming you have a ref to your terminal element
  const handexTermRef = useRef<HandexTerm>(null);

  useEffect(() => {
    const w = getContainerWidth();
    setContainerWidth(w);
   const handleClickOutsideTerminal = (event: MouseEvent) => {
      // Check if the click is outside of the terminal area
     if (
        handexTermRef.current &&
        handexTermRef.current.adapterRef.current &&
        handexTermRef.current.adapterRef.current.terminalRef.current &&
        !handexTermRef.current.adapterRef.current.terminalRef.current.contains(event.target as Node)
      ) {
          handexTermRef.current.adapterRef.current.terminalRef.current.focus();
          console.log('clicked outside of terminal to focus');

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
    <CommandProvider >
      <div ref={containerRef}>
        <HandexTerm
          ref={handexTermRef}
          terminalWidth={containerWidth}
        />
      </div>
    </CommandProvider>
  );
};

export default App;