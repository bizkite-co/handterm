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
  tutorialGroup?: string;
};

export const Achievements: Achievement[] = [
  { prompt: 'The most important key is the Return (ENTER) key. Press the thumb tip and release. You\'ll use this key to enter every command.\n\nNOTE: Type `tut` to run this tutorial again.', phrase: ['Return (ENTER)'], unlocked: false },
  // { prompt: 'The second most important key is the Backspace key. Just pull back the index finger.', phrase: ['DELETE (Backspace)'], command: 'x', unlocked: false },
  { prompt: 'Type `fdsa` & Enter. Notice that it requires finger-pinch only.', phrase: 'fdsa'.split(''), unlocked: false },
  { prompt: 'Type `jkl;`. Notice that it requires finger-grasp only.', phrase: 'jkl;'.split(''), unlocked: false, tutorialGroup: 'home-row' },
  { prompt: 'Press the thumb tip followed by a finger tip to type numbers 0-4', phrase: '01234'.split(''), unlocked: false },
  { prompt: 'Press the thumb tip followed by a finger tip to type numbers 5-9', phrase: '56789'.split(''), unlocked: false },
  { prompt: 'These characters are all triggered by a single finger. Pinch first, then grasp to enter them.', phrase: 'nm,.'.split(''), unlocked: false },
  { prompt: 'These characters are also triggered by a single finger. Grasp first, then pinch to enter them.', phrase: 'uiop'.split(''), unlocked: false },
  { prompt: 'These two characters complete the homerow keys, but require two finger keystrokes similar to numbers.', phrase: 'gh'.split(''), unlocked: false },
  { prompt: 'Many characters require combinations followed by releasing all keys. Type `zxcv` and we\'ll show corrections as you type.', phrase: 'zxcv'.split(''), unlocked: false },
  { prompt: 'Remember this one so that you can restart this tutorial', phrase: 'tut'.split(''), unlocked: false },
  { prompt: 'Type `play` to play a guided typing game with chord-hints.', phrase: 'play'.split(''), unlocked: false },
]
