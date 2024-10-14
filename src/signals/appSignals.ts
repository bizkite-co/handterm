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
  updateOutput(prevOutput => {
    const newOutput = [...prevOutput, element].slice(-3);
    return newOutput;
  });
};