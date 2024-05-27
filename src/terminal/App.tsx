// App.tsx
import React from 'react';
import { XtermAdapter } from './XtermAdapter';

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