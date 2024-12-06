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
    <div id="output-container">
      {outputElements.map((outputElement: OutputElement, index: number) => (
        <CommandOutput
          key={index}
          command={outputElement.command}
          response={outputElement.response}
          status={outputElement.status}
          wpms={{
            wpmAverage: outputElement?.wpmAverage ?? 0,
            charWpms: outputElement?.characterAverages ?? []
          }}
          commandTime={outputElement.commandTime}
        />
      ))}
    </div>
  );
};