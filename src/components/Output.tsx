// src/components/Output.tsx
import React, { useState } from 'react';
import { OutputElement } from 'src/types/Types';
import { CommandOutput } from './CommandOutput';
import { useSignalEffect } from '@preact/signals-react';
import { outputElementsSignal } from 'src/signals/appSignals';


export const Output: React.FC = () => {
  const [outputElements, setOutputElements] = useState<OutputElement[]>([]);

  useSignalEffect(() => {
    setOutputElements(outputElementsSignal.value);
  });

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