import { type ReactNode } from "react";
import type { CharTime } from '@handterm/types';

export const spaceDisplayChar = "&#x2581;";
export const tabDisplayChar = "&#x2B7E;";

export interface Keystroke {
  char: string;
  timestamp: number;
}


export type ParsedCommand = Readonly<{
  command: string;
  args: readonly string[];
  switches: Readonly<Record<string, boolean | string>>;
}>;

export function createCharTime(char: string, duration: number, time: number): CharTime {
  return { char, duration, time }
}

export type CancelCallback = () => void;

export type InputEventCallback = (event: InputEvent) => void;
export interface ChordRow {
  char: string;
  chord: number;
  strokes: string;
}

export interface IChord {
  key: string;
  chordCode: string;
  index: number;
  alias?: string;
}

export class Chord implements IChord {
  key: string;
  chordCode: string;
  index: number;
  alias?: string;
  constructor(key: string, chordCode: string, index: number) {
    this.key = key;
    this.chordCode = chordCode;
    this.index = index;
  }
}

export interface WPM {
  readonly wpm: number;
  readonly character: string;
  readonly durationMilliseconds: number;
}

export type WPMs = Readonly<{
  wpmAverage: number;
  charWpms: ReadonlyArray<WPM>;
}>
