export const spaceDisplayChar = "&#x2581;";
export const tabDisplayChar = "&#x2B7E;";
export interface CharTime {
    char: string;
    duration: number;
    time: number;
}

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

export type MyResponse<T> = {
  status: 200 | 400 | 401 | 403 | 404 | 500;
  data?: T | undefined;
  message: string | undefined;
  error: string[];
};

export type Achievement = {
  phrase: string[];
  prompt: string;
  command?: string;
  unlocked: boolean;
};

export const Achievements: Achievement[] = [
  { prompt: 'The most important key is the Return (ENTER) key. Press the thumb tip and release. You\'ll use this key to enter every command.\n\nNOTE: Type `tut` to run this tutorial again.', phrase: ['Return (ENTER)'], unlocked: false },
  // { prompt: 'The second most important key is the Backspace key. Just pull back the index finger.', phrase: ['DELETE (Backspace)'], command: 'x', unlocked: false },
  { prompt: 'Type `gfdsa` & Enter. Notice that it requires finger-pinch only.', phrase: 'gfdsa'.split(''), unlocked: false },
  { prompt: 'Type `hjkl;`. Notice that it requires finger-grasp only.', phrase: 'hjkl;'.split(''), unlocked: false },
  { prompt: 'Press the thumb tip followed by a finger tip to type numbers 1-4', phrase: '01234'.split(''), unlocked: false },
  { prompt: 'Many characters require combinations followed by releasing all keys. Type `zxcv` and we\'ll show corrections as you type.', phrase: 'zxcv'.split(''), unlocked: false },
  { prompt: 'Remember this one so that you can restart this tutorial', phrase: 'tut'.split(''), unlocked: false },
  { prompt: 'Type `play` to play a guided typing game with chord-hints.', phrase: 'play'.split(''), unlocked: false },
]
