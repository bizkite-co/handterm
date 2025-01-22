import { type ReactNode } from "react";

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

import type { ActivityType } from '@handterm/types';

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
  command: ParsedCommand;
  response?: ReactNode;
  status: number;
  wpmAverage?: number;
  characterAverages?: ReadonlyArray<WPM>;
  commandTime: Date;
  component?: ReactNode; // New field for React components
  sensitive?: boolean; // Flag to indicate if the command contains sensitive data
}

export type MyResponse<T> = {
  status: 200 | 400 | 401 | 403 | 404 | 500;
  data?: T | undefined;
  message: string | undefined;
  error: string[];
};

export const VALID_ACTIVITIES = ['normal', 'game', 'tutorial', 'edit', 'tree'] as const;
export type Activity = typeof VALID_ACTIVITIES[number];

export type ParsedLocation = {
  activityKey: ActivityType;
  contentKey?: string | null;
  groupKey?: string | null;
  clearParams?: boolean;
  skipTutorial?: boolean;
};

export type GitHubRepository = {
  full_name: string;
  language?: string;
  description?: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  stargazers_count: number;
};

export type GamePhrase = {
  key: string,
  value: string,
  displayAs: 'Tutorial' | 'Game',
  tutorialGroup?: string,
  isComplete?: boolean
};

export const allTutorialPhraseNames = [ "\r", "fdsa", "jkl;", "01234", "56789", "FDSA", "gh", "nm,.", "uiop", "zxcv", "tut", "play" ];

export const Phrases: GamePhrase[] = [
  {
    value: 'The most important key is the Return (ENTER) key. Press the thumb tip and release. You\'ll use this key to enter every command.\n\nNOTE: Press enter to reset and redo any tutorial steps.',
    displayAs: 'Tutorial',
    key: '\r',
  },
  {
    value: 'Type `fdsa` & Enter. Notice that it requires only a finger-pinch and release for each character.',
    displayAs: 'Tutorial',
    key: 'fdsa',
  },
  {
    value: 'Type `jkl;`. Notice that it requires only a finger-grasp followed by a release.',
    displayAs: 'Tutorial',
    key: 'jkl;',
    tutorialGroup: 'single-click'
  },
  {
    key: "first-eight",
    displayAs: "Game",
    value: "all sad lads ask dad; alas fads fall",
    tutorialGroup: "single-click"
  },
  {
    value: 'Press the thumb tip followed by a finger tip to type numbers 0-4',
    displayAs: 'Tutorial',
    key: '01234'
  },
  {
    value: 'Press the thumb tip followed by a finger tip to type numbers 5-9',
    displayAs: 'Tutorial',
    key: '56789',
    tutorialGroup: 'numbers'
  },
  {
    key: "numbers",
    displayAs: "Game", value: "0123 4567 8901 2345 6789 0987", tutorialGroup: "numbers"
  },
  {
    value: 'Characters are only entered when the keys are released. For example, when you grasp the thumb and release it a space is entered.\n\nHowever, when you HOLD a grasp of your thumb it activates the shift key. Use Shift to type FDSA in uppercase letters. Remember to release your grip after each character.',
    displayAs: 'Tutorial',
    key: 'FDSA'
  },
  {
    value: 'These two characters complete the traditional home-row keys, but require two finger keystrokes similar to numbers. \n\nNotice that both actions start from the middle finger and end on the index finger. G uses 2 pinches. H uses 2 grasps, like their home-row counterparts.',
    displayAs: 'Tutorial',
    key: 'gh', tutorialGroup: 'home-row'
  },
  {
    key: "ask",
    displayAs: "Game", value: "All lads had flasks as glad gals ask halls; all had a glass", tutorialGroup: "home-row"
  },
  { key: "gallant", displayAs: "Game", value: "A gallant lad; a glass", tutorialGroup: "home-row" },
  {
    value: 'These characters are all triggered by a single finger. Pinch first, then grasp to enter them.',
    displayAs: 'Tutorial',
    key: 'nm,.'
  },
  {
    value: 'These characters are also triggered by a single finger. Grasp first, then pinch to enter them.',
    displayAs: 'Tutorial',
    key: 'uiop'
  },
  {
    value: 'Many characters require combinations followed by releasing all keys. Type `zxcv` and we\'ll show corrections as you type.',
    displayAs: 'Tutorial',
    key: 'zxcv'
  },
  {
    value: 'Remember this one so that you can restart this tutorial',
    displayAs: 'Tutorial',
    key: 'tut'
  },
  {
    value: 'Type `play` to play a guided typing game with chord-hints.',
    displayAs: 'Tutorial',
    key: 'play'
  },
  { key: "alas", displayAs: "Game", value: "Alas, Khal's flask has a crack." },
  { key: "lads", displayAs: "Game", value: "Lads' flags fall as gaffs sag." },
  { key: "hello", displayAs: "Game", value: "Hello, World!" },
  { key: "pack", displayAs: "Game", value: "Pack my box with five dozen liquor jugs." },
  { key: "sphinx", displayAs: "Game", value: "Sphinx of black quartz, judge my vow." },
  { key: "waltz", displayAs: "Game", value: "Waltz, bad nymph, for quick jigs vex." },
  { key: "list", displayAs: "Game", value: "List.map(fun i -> i + 1)[1;2;3]" },
  { key: "mr", displayAs: "Game", value: "Mr. Jock, TV quiz PhD., bags few lynx." },
  { key: "watch", displayAs: "Game", value: "Watch \"Jeopardy!\", Alex Trebek's fun TV" },
  { key: "h1", displayAs: "Game", value: "Type anywhere with this one-handed keyboard. Stop sitting down to type. Stop looking down to send messages." },
  { key: "h2", displayAs: "Game", value: "Built to the shape of your finger actions, this device will eliminate your need to reposition your fingers while typeing." },
  { key: "h3", displayAs: "Game", value: "Use the same keyboard, designed for your hand, everywhere. You never have to learn a new one. The natural motions of your fingers compose the characters." },
  { key: "h4", displayAs: "Game", value: "It's built around your hand, so you don't have to reorient your finger placement on a board. Repositioning your fingers on a board is the biggest hurdle of typing-training, so don't do it." },
  { key: "h5", displayAs: "Game", value: "Handex is built around your finger movements, so you'll never have to reposition your fingers to find a key. Even unusual keys, such `\\`, `~`, `|`, `^`, `&` are easy to type." },
  { key: "h6", displayAs: "Game", value: "Handex liberates you from the key-board-shackle problem. 151 keys are currently available and more are coming." },
  { key: "k=7", displayAs: "Game", value: "k=7; l=8; m=$((k + l)); n=$((k > l ? k : l)); echo \"Max: $n\"; grep 'Max' <<< \"Max: $n\" || echo \"No match found\" > /dev/null; echo \"Sum: $(($m))\"" },
  { key: "x=4", displayAs: "Game", value: "x=4; y=$((x + 5)); z=$((x > 5 ? x : 5)); echo \"Max: $z\"; grep 'Max' <<< \"Max: $z\" || echo \"No match found\" > /dev/null; echo \"Sum: $(($y))\"" },
  { key: "arr", displayAs: "Game", value: "arr=(1 2 3); sum=0; for i in \"${arr[@]}\"; do sum=$(($sum + i)); done; echo \"Sum: $sum\"; [[ $sum -lt 10 ]] && echo \"$sum < 10\" || echo \"$sum >= 10\"" },
  { key: "f()", displayAs: "Game", value: "f() { return $(($1 & $2)); }; f 4 5; echo \"Bitwise AND: $?\"" },
  { key: "a=5", displayAs: "Game", value: "a=5; b=3; c=$((a / b)); d=$((a - b)); echo $c $d; [ $a -gt $b ] && echo \"$a>$b\" || echo \"$a<$b\"; e=$(($a % $b)); echo \"Result: $e\"" }

]
