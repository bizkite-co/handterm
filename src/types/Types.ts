
export const spaceDisplayChar = "&#x2581;";
export const tabDisplayChar = "&#x2B7E;";
export interface CharTime {
  char: string;
  duration: number;
  time: number;
}

export interface Keystroke {
  char: string;
  timestamp: number;
}

export enum ActivityType {
  NORMAL,
  TUTORIAL,
  GAME,
  EDIT,
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

export interface OutputElement {
  command: string;
  response: string;
  status: number;
  wpmAverage: number;
  characterAverages: ReadonlyArray<WPM>;
  commandTime: Date;
}

export type MyResponse<T> = {
  status: 200 | 400 | 401 | 403 | 404 | 500;
  data?: T | undefined;
  message: string | undefined;
  error: string[];
};

export type Tutorial = {
  phrase: string[];
  prompt: string;
  command?: string;
  unlocked: boolean;
  tutorialGroup?: string;
};

export const Tutorials: Tutorial[] = [
  { prompt: 'The most important key is the Return (ENTER) key. Press the thumb tip and release. You\'ll use this key to enter every command.\n\nNOTE: Press enter to reset and redo any tutorial steps.', phrase: ['Return (ENTER)'], unlocked: false },
  { prompt: 'Type `fdsa` & Enter. Notice that it requires only a finger-pinch and release for each character.', phrase: 'fdsa'.split(''), unlocked: false },
  { prompt: 'Do it again, but this time put a space in between the letters. Grasp the thumb and release to enter a space.', phrase: 'fdsa'.split(' '), unlocked: false },
  // { prompt: 'The second most important key is the Backspace key. To use it, pull back the index finger. Practice typing fdsa and then deleting it. Then press enter to continue.', phrase: ['DELETE (Backspace)'], unlocked: false},
  { prompt: 'Type `jkl;`. Notice that it requires only a finger-grasp followed by a release.', phrase: 'jkl;'.split(''), unlocked: false, tutorialGroup: 'single-click' },
  { prompt: 'Press the thumb tip followed by a finger tip to type numbers 0-4', phrase: '01234'.split(''), unlocked: false },
  { prompt: 'Press the thumb tip followed by a finger tip to type numbers 5-9', phrase: '56789'.split(''), unlocked: false, tutorialGroup: 'numbers' },
  { prompt: 'Characters are only entered when the keys are released. For example, when you grasp the thumb and release it a space is entered.\n\nHowever, when you HOLD a grasp of your thumb it activates the shift key. Use Shift to type FDSA in uppercase letters. Remember to release your grip after each character.', phrase: 'FDSA'.split(''), unlocked: false },
  { prompt: 'These two characters complete the traditional home-row keys, but require two finger keystrokes similar to numbers. \n\nNotice that both actions start from the middle finger and end on the index finger. G uses 2 pinches. H uses 2 grasps, like their home-row counterparts.', phrase: 'gh'.split(''), unlocked: false, tutorialGroup: 'home-row' },
  { prompt: 'These characters are all triggered by a single finger. Pinch first, then grasp to enter them.', phrase: 'nm,.'.split(''), unlocked: false },
  { prompt: 'These characters are also triggered by a single finger. Grasp first, then pinch to enter them.', phrase: 'uiop'.split(''), unlocked: false },
  { prompt: 'Many characters require combinations followed by releasing all keys. Type `zxcv` and we\'ll show corrections as you type.', phrase: 'zxcv'.split(''), unlocked: false },
  { prompt: 'Remember this one so that you can restart this tutorial', phrase: 'tut'.split(''), unlocked: false },
  { prompt: 'Type `play` to play a guided typing game with chord-hints.', phrase: 'play'.split(''), unlocked: false },
]

