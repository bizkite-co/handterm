// App.tsx
import React from 'react';
import { XtermAdapter } from './XtermAdapter';
import { LocalStoragePersistence } from './Persistence';
import { HandexTerm } from './HandexTerm';
import { TerminalCssClasses } from './TerminalTypes';

// App.tsx
class App extends React.Component {
  terminalElementRef = React.createRef<HTMLDivElement>();

  constructor(props: any) {
    super(props);
  }

  render() {
    return (
      <div>
        <XtermAdapter
          terminalElement={this.terminalElementRef.current}
          terminalElementRef={this.terminalElementRef}

        />
      </div>
    );
  }
}

export default App;