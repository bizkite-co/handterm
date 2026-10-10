import { GamePhrase } from "./index.js";

export const Phrases: GamePhrase[] = [
  {
    value: 'The most important key is the Return (ENTER) key. Press the thumb tip and release. You\'ll use this key to enter every command.\n\nNOTE: Press enter to reset and redo any tutorial steps.',
    displayAs: 'Tutorial',
    key: '\r',
    introducedKeys: '',
  },
  {
    value: 'Type `fdsa` & Enter. Notice that it requires only a finger-pinch and release for each character.',
    displayAs: 'Tutorial',
    key: 'fdsa',
    introducedKeys: 'fdsa',
  },
  {
    value: 'Type `jkl;`. Notice that it requires only a finger-grasp followed by a release.',
    displayAs: 'Tutorial',
    key: 'jkl;',
    introducedKeys: 'jkl;',
  },
  {
    value: 'Characters are only entered when the keys are released. For example, when you grasp the thumb and release it a space is entered.\n\nHowever, when you HOLD a grasp of your thumb it activates the shift key. Use Shift to type FDSA in uppercase letters. Remember to release your grip after each character.',
    displayAs: 'Tutorial',
    key: 'FDSA',
    tutorialGroup: 'single-click',
    introducedKeys: 'FDSA ',
  },
  {
    key: "first-eight",
    displayAs: "Game",
    value: "All sad lads ask dad; alas fads fall",
    tutorialGroup: "single-click"
  },
  {
    value: 'Press the thumb tip followed by a finger tip to type numbers 0-4',
    displayAs: 'Tutorial',
    key: '01234',
    introducedKeys: '01234',
  },
  {
    value: 'Press the thumb tip followed by a finger tip to type numbers 5-9',
    displayAs: 'Tutorial',
    key: '56789',
    tutorialGroup: 'numbers',
    introducedKeys: '56789',
  },
  {
    key: "numbers",
    displayAs: "Game",
    value: "0123 4567 8901 2345 6789 0987",
    tutorialGroup: "numbers"
  },
  {
    value: 'These two characters complete the traditional home-row keys, but require two finger keystrokes similar to numbers. \n\nNotice that both actions start from the middle finger and end on the index finger. G uses 2 pinches. H uses 2 grasps, like their home-row counterparts.',
    displayAs: 'Tutorial',
    key: 'gh',
    tutorialGroup: 'home-row',
    introducedKeys: 'gh',
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
    value: "A glad lad; a glass",
    tutorialGroup: "home-row"
  },
  {
    value: 'Type `eiwo`. These letters sit off the home row and use two-finger chords.',
    displayAs: 'Tutorial',
    key: 'eiwo',
    tutorialGroup: 'eiwo',
    introducedKeys: 'eiwo',
  },
  {
    key: "wise-owl",
    displayAs: "Game",
    value: "We see a wise owl; a few kids like salad",
    tutorialGroup: "eiwo"
  },
  {
    key: "feed-seeds",
    displayAs: "Game",
    value: "We feed all kids; a glad dad likes seeds",
    tutorialGroup: "eiwo"
  },
  {
    value: 'Type `tynu`. These four letters add T, Y, N, and U.',
    displayAs: 'Tutorial',
    key: 'tynu',
    tutorialGroup: 'tynu',
    introducedKeys: 'tynu',
  },
  {
    key: "yellow-sun",
    displayAs: "Game",
    value: "They still like the yellow sun; a few kids yell",
    tutorialGroup: "tynu"
  },
  {
    key: "yellow-hats",
    displayAs: "Game",
    value: "Aunt Jenny sent the kids yellow hats",
    tutorialGroup: "tynu"
  },
  {
    value: 'Type `cmp.`. Add C, M, P, and the period.',
    displayAs: 'Tutorial',
    key: 'cmp.',
    tutorialGroup: 'cmp',
    introducedKeys: 'cmp.',
  },
  {
    key: "camp-soup",
    displayAs: "Game",
    value: "We camp. Some kids like soup.",
    tutorialGroup: "cmp"
  },
  {
    key: "simple-meal",
    displayAs: "Game",
    value: "Come play. A simple meal; we ate some soup.",
    tutorialGroup: "cmp"
  },
  {
    value: 'Type `brvx`. Add B, R, V, and X.',
    displayAs: 'Tutorial',
    key: 'brvx',
    tutorialGroup: 'brvx',
    introducedKeys: 'brvx',
  },
  {
    key: "brave-fox",
    displayAs: "Game",
    value: "A brave fox; very big red birds box.",
    tutorialGroup: "brvx"
  },
  {
    key: "very-brave",
    displayAs: "Game",
    value: "Very brave kids box a big red fox.",
    tutorialGroup: "brvx"
  },
  {
    value: "Type `qz'`. Add Q, Z, and the apostrophe.",
    displayAs: 'Tutorial',
    key: "qz'",
    tutorialGroup: 'qz',
    introducedKeys: "qz'",
  },
  {
    key: "jazz-quiz",
    displayAs: "Game",
    value: "It's a lazy quiz; jazz foxes box.",
    tutorialGroup: "qz"
  },
  {
    key: "quiz-kids",
    displayAs: "Game",
    value: "Quiz the kids. It's jazz.",
    tutorialGroup: "qz"
  }
];

export const allTutorialKeys = Phrases
  .filter(t => t.displayAs === "Tutorial")
  .map(t => t.key);