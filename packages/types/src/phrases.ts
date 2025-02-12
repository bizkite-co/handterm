import { GamePhrase } from "./index.js";

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
    displayAs: "Game",
    value: "0123 4567 8901 2345 6789 0987",
    tutorialGroup: "numbers"
  },
  {
    value: 'Characters are only entered when the keys are released. For example, when you grasp the thumb and release it a space is entered.\n\nHowever, when you HOLD a grasp of your thumb it activates the shift key. Use Shift to type FDSA in uppercase letters. Remember to release your grip after each character.',
    displayAs: 'Tutorial',
    key: 'FDSA'
  },
  {
    value: 'These two characters complete the traditional home-row keys, but require two finger keystrokes similar to numbers. \n\nNotice that both actions start from the middle finger and end on the index finger. G uses 2 pinches. H uses 2 grasps, like their home-row counterparts.',
    displayAs: 'Tutorial',
    key: 'gh',
    tutorialGroup: 'home-row'
  },
  {
    key: "ask",
    displayAs: "Game",
    value: "All lads had flasks as glad gals ask halls; all had a glass",
    tutorialGroup: "home-row"
  },
  {
    key: "gallant",
    displayAs: "Game",
    value: "A gallant lad; a glass",
    tutorialGroup: "home-row"
  }
];

export const allTutorialKeys = Phrases
  .filter(t => t.displayAs === "Tutorial")
  .map(t => t.key);