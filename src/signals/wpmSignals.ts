// src/signals/wpmSignals.ts
import { signal } from "@preact/signals-react";
import { Keystroke } from "../types/Types"; // Assuming you have this type defined

export const keystrokesSignal = signal<Keystroke[]>([]);

export const addKeystroke = (char: string) => {
  keystrokesSignal.value = [...keystrokesSignal.value, { char, timestamp: performance.now() }];
};

export const clearKeystrokes = () => {
  keystrokesSignal.value = [];
};