import { type GamePhrase } from '@handterm/types';

/**
 * Practice Level 100: Basic English letters (a-z, A-Z), period (.), comma (,), and spaces.
 * ~250 characters per passage, covering all 26 letters of the English alphabet. Exactly 3 phrases.
 */
export const WPM_PRACTICE_100_PHRASES: readonly string[] = [
  'The quick brown fox jumps over a lazy dog, while five expert judges quickly examine a dozen fine bronze jewels. Packed with great zeal, lazy kings and quirky queens boxed with heavy vigor, proving just how quietly clever foxes can outwit jumping wolves.',
  'A quick movement of the enemy will jeopardize six gunboats, yet quirky brave wizards quickly jinx lazy dwarfs. Bright foxes jump over the lazy dog, and pack my box with five dozen liquor jugs, while six quiet judges expertly view the crazy show.',
  'Six crazy kings vowed that five big liquor jugs would quickly mix with frozen rye, yet a quiet brown fox jumps gracefully over every lazy dog. With great zeal and joy, quirky scholars packed boxes with prized bronze jewels, making everyone smile.',
];

// Backwards-compatible alias
export const WPM_LEVEL_100_PHRASES = WPM_PRACTICE_100_PHRASES;

/**
 * Practice Level 200: Basic English writing characters: letters, period, comma, space,
 * plus ";'?!$%&*\x2f() (common punctuation and financial/operational symbols).
 * ~240-250 characters per passage, covering all 26 letters and all targeted punctuation. Exactly 3 phrases.
 */
export const WPM_PRACTICE_200_PHRASES: readonly string[] = [
  'Why did the quick brown fox jump (expertly) over the lazy dog? "Watch out!" cried Jack\'s old aunt & uncle; their budget grew by 5% ($100/day) * 2. Five dozen crazy kings quietly packed yellow boxes with frozen jewels, proving that zeal was key.',
  '"Quick! Is the wizard\'s big brown fox jumping over the lazy dog?" asked Jack (in panic); sales jumped 15% & profits doubled ($50/hour * 8)! Six quirky judges quietly packed twelve heavy bronze boxes, admiring the vibrant, extra crazy zeal.',
  'Can five dozen expert judges quickly evaluate Jack\'s crazy proposal? "Yes!" said the clerk; market share jumped 20% & cash grew ($400/week) * 3 (net). The quiet brown fox seized victory, moving with bold, fiery zeal past sixty lazy wolves.',
];

// Backwards-compatible alias
export const WPM_LEVEL_200_PHRASES = WPM_PRACTICE_200_PHRASES;

/**
 * Time Trial Level 100 (-t): Sprint phrases between 25-40 characters.
 * All lower case, no punctuation, no numbers, single phrase. Average length: exactly 29 characters. Exactly 3 phrases.
 */
export const WPM_TRIAL_100_PHRASES: readonly string[] = [
  'the quick brown fox jumps high', // 30 chars
  'bright stars shine in the sky',  // 29 chars
  'lazy dogs sleep in warm sand',   // 28 chars
];

/**
 * Time Trial Level 200 (-t 200): Sprint phrases between 25-40 characters.
 * Includes punctuation and symbols from level 200. Exactly 3 phrases.
 */
export const WPM_TRIAL_200_PHRASES: readonly string[] = [
  'can you jump? "yes!" he said',  // 28 chars
  'save 15% & win cash ($50/hr)!', // 29 chars
  "it's done: fast * bold (now)!", // 29 chars
];

let lastPractice100Index = -1;
let lastPractice200Index = -1;
let lastTrial100Index = -1;
let lastTrial200Index = -1;

export function getWpmPhrase(level: number = 100, isTrial: boolean = false): GamePhrase {
  if (isTrial) {
    if (level === 200) {
      lastTrial200Index = (lastTrial200Index + 1) % WPM_TRIAL_200_PHRASES.length;
      const value = WPM_TRIAL_200_PHRASES[lastTrial200Index]!;
      return {
        key: `wpm-trial-200-${lastTrial200Index + 1}`,
        displayAs: 'WPM',
        value,
        tutorialGroup: 'trial-200',
      };
    }

    lastTrial100Index = (lastTrial100Index + 1) % WPM_TRIAL_100_PHRASES.length;
    const value = WPM_TRIAL_100_PHRASES[lastTrial100Index]!;
    return {
      key: `wpm-trial-100-${lastTrial100Index + 1}`,
      displayAs: 'WPM',
      value,
      tutorialGroup: 'trial-100',
    };
  }

  if (level === 200) {
    lastPractice200Index = (lastPractice200Index + 1) % WPM_PRACTICE_200_PHRASES.length;
    const value = WPM_PRACTICE_200_PHRASES[lastPractice200Index]!;
    return {
      key: `wpm-practice-200-${lastPractice200Index + 1}`,
      displayAs: 'WPM',
      value,
      tutorialGroup: '200',
    };
  }

  // Default to level 100 practice
  lastPractice100Index = (lastPractice100Index + 1) % WPM_PRACTICE_100_PHRASES.length;
  const value = WPM_PRACTICE_100_PHRASES[lastPractice100Index]!;
  return {
    key: `wpm-practice-100-${lastPractice100Index + 1}`,
    displayAs: 'WPM',
    value,
    tutorialGroup: '100',
  };
}
