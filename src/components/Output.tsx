// src/components/Output.tsx

import React from 'react';
import { useAppContext } from 'src/contexts/AppContext';
import { OutputElement } from 'src/types/Types';
import { CommandOutput } from './CommandOutput';

export const Output: React.FC = () => {
  const { outputElements } = useAppContext();
   
  return (
    <div className="output-container">
      {outputElements.map((element: OutputElement, index: number) => (
        <CommandOutput
          key={index}
          command={element.command}
          response={element.response}
          status={element.status}
          wpms={{
            wpmAverage: element.wpmAverage,
            charWpms: element.characterAverages
          }}
          commandTime={element.commandTime}
        />
      ))}
    </div>
  );
};
