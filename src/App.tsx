// App.tsx
import React, { useEffect } from 'react';
import { HandexTerm } from './components/HandTerm';
import SpriteManagerContext from './game/SpriteManagerContext';
import { SpriteManager } from './game/sprites/SpriteManager';
import { CommandContext, ICommandContext } from './commands/CommandContext';
import { CommandExecutor } from './commands/CommandExecutor';
import { CommandProvider } from './commands/CommandProvider';
// App.tsx

const spriteManager = new SpriteManager();
// Create an object that matches the ICommandContext interface
const commandContextValue: ICommandContext = {
  // Initialize the ICommandContext properties
  videoRef: React.createRef<HTMLVideoElement>(),
  // ...
};

const App = () => {
  const containerRef = React.createRef<HTMLDivElement>();
  const [containerWidth, setContainerWidth] = React.useState<number>(0);
  const [commandHistory, setCommandHistory] = React.useState<string[]>([]);

  useEffect(() => {
    const w = getContainerWidth();
    setContainerWidth(w);
  }, [])

  const getContainerWidth = () => {
    return containerRef.current?.clientWidth ?? 0
  }
  // The context value must include all properties and functions defined in ICommandContext
  const commandContextValue = {
    commandHistory,
    setCommandHistory,
    // ... other properties and functions
  };
  useEffect(() => {
    const handleResize = () => {
      const w = getContainerWidth();
      setContainerWidth(w);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  })

  return (
    <CommandProvider value={commandContextValue}>
      <CommandExecutor />
        <div ref={containerRef}>
          <HandexTerm
            terminalWidth={containerWidth}
          />
        </div>
    </CommandProvider>
  );
};

export default App;