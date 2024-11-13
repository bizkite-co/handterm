import { signal } from '@preact/signals-react';

export const commandLineSignal = signal('');
export const setPromptInfo = jest.fn();
export const promptInfoSignal = signal({
  prompt: '',
  isPassword: false
});
