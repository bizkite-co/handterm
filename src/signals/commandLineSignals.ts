// src/signals/wpmSignals.ts
import { signal } from "@preact/signals-react";

import { type Keystroke, type ParsedCommand } from "../types/Types"; // Assuming you have this type defined

export const keystrokesSignal = signal<Keystroke[]>([]);
export const commandSignal = signal<ParsedCommand>();
export const commandLineSignal = signal<string>('');
export const commandTimeSignal = signal<Date>(new Date);
export const promptInfoSignal = signal<string>('');

/**
 * Sets the prompt information
 * @param info - The prompt information to set
 */
export const setPromptInfo = (info: string): void => {
  promptInfoSignal.value = info;
}

/**
 * Adds a keystroke to the signal
 * @param char - The character to add
 */
export const addKeystroke = (char: string): void => {
  keystrokesSignal.value = [...keystrokesSignal.value, { char, timestamp: performance.now() }];
};

/**
 * Clears all keystrokes from the signal
 */
export const clearKeystrokes = (): void => {
  keystrokesSignal.value = [];
};

/**
 * Sets the current command
 * @param command - The command to set
 */
export const setCommand = (command: ParsedCommand): void => {
  commandSignal.value = command;
}

/**
 * Sets the command line text
 * @param commandLine - The command line text to set
 */
export const setCommandLine = (commandLine: string): void => {
  commandLineSignal.value = commandLine;
}

/**
 * Sets the command execution time
 * @param commandTime - The time to set
 */
export const setCommandTime = (commandTime: Date): void => {
  commandTimeSignal.value = commandTime;
}
