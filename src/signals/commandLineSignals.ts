// src/signals/wpmSignals.ts
import { signal } from "@preact/signals-react";
import { Keystroke, ParsedCommand } from "../types/Types"; // Assuming you have this type defined

export const keystrokesSignal = signal<Keystroke[]>([]);
export const commandSignal = signal<ParsedCommand>();
export const commandLineSignal = signal<string>('');
export const commandTimeSignal = signal<Date>(new Date);
export const promptInfoSignal = signal<string>('');

export const setPromptInfo = (info:string) => {
  promptInfoSignal.value = info;
}

export const addKeystroke = (char: string) => {
  keystrokesSignal.value = [...keystrokesSignal.value, { char, timestamp: performance.now() }];
};

export const clearKeystrokes = () => {
  keystrokesSignal.value = [];
};

export const setCommand = (command:ParsedCommand) => {
  commandSignal.value = command;
}

export const setCommandLine = (commandLine:string) => {
  commandLineSignal.value = commandLine;
}

export const setCommandTime = (commandTime:Date) => {
  commandTimeSignal.value = commandTime;
}