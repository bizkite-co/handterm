// src/signals/appSignals.ts
import { signal } from '@preact/signals-react';
import { OutputElement } from 'src/types/Types';
import { createPersistentSignal } from 'src/utils/signalPersistence';

const currentOutputKey = 'current-output';
const { signal: outputElementsSignal, update: updateOutput } = createPersistentSignal({
    key: currentOutputKey,
    signal: signal<OutputElement[]>([]),
    serialize: (value) => JSON.stringify(value),
    deserialize: (value) => JSON.parse(value)
});

export { outputElementsSignal };

export const appendToOutput = (element: OutputElement) => {
  console.log('Appending output:', element);
  updateOutput(prevOutput => {
    const newOutput = [...prevOutput, element].slice(-3);
    console.log('New output:', newOutput);
    return newOutput;
  });
  console.log('Current signal value after update:', outputElementsSignal.value);
};