// App.tsx
import React from 'react';
import { HandexTerm } from './HandexTerm';
import SpriteManagerContext from './SpriteManagerContext';
import { SpriteManager } from './game/sprites/SpriteManager';
// App.tsx

const spriteManager = new SpriteManager();

class App extends React.Component {
  terminalElementRef = React.createRef<HTMLDivElement>();

  constructor(props: any) {
    super(props);
  }

  render() {
    return (
      <SpriteManagerContext.Provider value={spriteManager}>
        <HandexTerm 
        />
      </SpriteManagerContext.Provider>
    );
  }
}

export default App;