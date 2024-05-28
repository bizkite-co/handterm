// App.tsx
import React from 'react';
import { HandexTerm } from './HandexTerm';

// App.tsx
class App extends React.Component {
  terminalElementRef = React.createRef<HTMLDivElement>();

  constructor(props: any) {
    super(props);
  }

  render() {
    return (
      <div>
        <HandexTerm 
        />
      </div>
    );
  }
}

export default App;