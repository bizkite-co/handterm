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
}

export class Chord implements IChord {
    key: string;
    chordCode: string;
    index: number;
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
  unlocked: boolean;
};

export const Achievements: Achievement[] = [
  { prompt: 'The most important key is the Return (ENTER) key. Press the thumb tip and release. You\'ll use this key to enter every command.', phrase: ['Return (ENTER)'], unlocked: false },
  { prompt: 'Type `fdsa` & Enter. Notice that it requires finger-pinch only.', phrase: 'fdsa'.split(''), unlocked: false },
  { prompt: 'Type `jkl;`. Notice that it requires finger-grasp only.', phrase: 'jkl;'.split(''), unlocked: false },
  { prompt: 'Press the thumb tip followed by a finger tip to type numbers 1-4', phrase: '1234'.split(''), unlocked: false },
  { prompt: 'Many characters require combinations followed by releasing all keys. Type `zxcv` and we\'ll show corrections as you type.', phrase: 'zxcv'.split(''), unlocked: false },
]