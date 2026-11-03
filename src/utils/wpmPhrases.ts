import { type GamePhrase } from '@handterm/types';

/**
 * Level 100: Basic English letters (a-z, A-Z), period (.), comma (,), and spaces.
 * Exactly ~250 characters per passage, covering all 26 letters of the English alphabet.
 */
export const WPM_LEVEL_100_PHRASES: readonly string[] = [
  'The quick brown fox jumps over a lazy dog, while five expert judges quickly examine a dozen fine bronze jewels. Packed with great zeal, lazy kings and quirky queens boxed with heavy vigor, proving just how quietly clever foxes can outwit jumping wolves.',
  'A quick movement of the enemy will jeopardize six gunboats, yet quirky brave wizards quickly jinx lazy dwarfs. Bright foxes jump over the lazy dog, and pack my box with five dozen liquor jugs, while six quiet judges expertly view the crazy show.',
  'Six crazy kings vowed that five big liquor jugs would quickly mix with frozen rye, yet a quiet brown fox jumps gracefully over every lazy dog. With great zeal and joy, quirky scholars packed boxes with prized bronze jewels, making everyone smile.',
  'Jack quietly moved forward, packing five dozen big red boxes with heavy zinc jugs while six quirky wizards explored the cozy cave. Every bold fox quickly jumped over the lazy dog, proving that zealous youth always triumph over dark, tricky times.',
];

/**
 * Level 200: Basic English writing characters: letters, period, comma, space,
 * plus ";'?!$%&*\x2f() (common punctuation and financial/operational symbols).
 * Exactly ~240-250 characters per passage, covering all 26 letters and all targeted punctuation.
 */
export const WPM_LEVEL_200_PHRASES: readonly string[] = [
  'Why did the quick brown fox jump (expertly) over the lazy dog? "Watch out!" cried Jack\'s old aunt & uncle; their budget grew by 5% ($100/day) * 2. Five dozen crazy kings quietly packed yellow boxes with frozen jewels, proving that zeal was key.',
  '"Quick! Is the wizard\'s big brown fox jumping over the lazy dog?" asked Jack (in panic); sales jumped 15% & profits doubled ($50/hour * 8)! Six quirky judges quietly packed twelve heavy bronze boxes, admiring the vibrant, extra crazy zeal.',
  'Can five dozen expert judges quickly evaluate Jack\'s crazy proposal? "Yes!" said the clerk; market share jumped 20% & cash grew ($400/week) * 3 (net). The quiet brown fox seized victory, moving with bold, fiery zeal past sixty lazy wolves.',
];

let last100Index = -1;
let last200Index = -1;

export function getWpmPhrase(level: number = 100): GamePhrase {
  if (level === 200) {
    last200Index = (last200Index + 1) % WPM_LEVEL_200_PHRASES.length;
    const value = WPM_LEVEL_200_PHRASES[last200Index]!;
    return {
      key: `wpm-200-${last200Index + 1}`,
      displayAs: 'WPM',
      value,
      tutorialGroup: '200',
    };
  }

  // Default to level 100
  last100Index = (last100Index + 1) % WPM_LEVEL_100_PHRASES.length;
  const value = WPM_LEVEL_100_PHRASES[last100Index]!;
  return {
    key: `wpm-100-${last100Index + 1}`,
    displayAs: 'WPM',
    value,
    tutorialGroup: '100',
  };
}
