// App.tsx
import React, { useEffect } from 'react';
import { HandexTerm } from './HandexTerm';
import SpriteManagerContext from './SpriteManagerContext';
import { SpriteManager } from './game/sprites/SpriteManager';
// App.tsx

const spriteManager = new SpriteManager();

const App = () => {
  const containerRef = React.createRef<HTMLDivElement>();
  const [containerWidth, setContainerWidth] = React.useState<number>(0);

  useEffect(() => {
    const w = getContainerWidth();
    console.log(`containerWidth: ${w}`);
    setContainerWidth(w);
  }, [])

  const getContainerWidth = () => {
    return containerRef.current?.clientWidth ?? 0
  }

  useEffect(() => {
    const handleResize = () => {
      const w = getContainerWidth();
      console.log(`containerWidth: ${w}`);
      setContainerWidth(w);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  })

  return (
    <SpriteManagerContext.Provider value={spriteManager}>
      <div ref={containerRef}>
        <HandexTerm
          terminalWidth={containerWidth}
        />
      </div>
    </SpriteManagerContext.Provider>
  );
};

export default App;