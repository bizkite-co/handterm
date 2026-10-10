import { describe, expect, test } from 'vitest';

import { Phrases } from '@handterm/types';

/** Space is used in every sentence; Enter is taught first but not typed inside phrases. */
const ALWAYS_ALLOWED = new Set([' ']);

function addUppercaseOfTaughtLetters(taught: Set<string>): void {
  for (const ch of [...taught]) {
    if (ch >= 'a' && ch <= 'z') {
      taught.add(ch.toUpperCase());
    }
  }
}

function taughtKeysAfterTutorialsThrough(index: number): Set<string> {
  const taught = new Set(ALWAYS_ALLOWED);
  let shiftTaught = false;
  for (let i = 0; i <= index; i++) {
    const phrase = Phrases[i];
    if (phrase === undefined || phrase.displayAs !== 'Tutorial') {
      continue;
    }
    const introduced = phrase.introducedKeys ?? phrase.key;
    for (const ch of introduced) {
      if (ch !== '\r') {
        taught.add(ch);
      }
    }
    if (phrase.key === 'FDSA') {
      shiftTaught = true;
    }
    if (shiftTaught) {
      addUppercaseOfTaughtLetters(taught);
    }
  }
  return taught;
}

describe('phrase curriculum', () => {
  test('every game sentence only uses keys taught so far', () => {
    Phrases.forEach((phrase, index) => {
      if (phrase.displayAs !== 'Game') {
        return;
      }
      const taught = taughtKeysAfterTutorialsThrough(index);
      const untaught = [...phrase.value].filter(ch => !taught.has(ch));
      expect(untaught, `${phrase.key} uses untaught characters: ${[...new Set(untaught)].join(' ')}`).toEqual([]);
    });
  });

  test('eiwo cluster introduces e, i, w, o then two sentences', () => {
    const tutorial = Phrases.find(p => p.key === 'eiwo');
    expect(tutorial?.displayAs).toBe('Tutorial');
    expect(tutorial?.tutorialGroup).toBe('eiwo');
    const games = Phrases.filter(p => p.displayAs === 'Game' && p.tutorialGroup === 'eiwo');
    expect(games.map(g => g.key)).toEqual(['wise-owl', 'feed-seeds']);
  });

  test('curriculum continues after eiwo with tynu, cmp, brvx, and qz', () => {
    const groups = ['tynu', 'cmp', 'brvx', 'qz'];
    for (const group of groups) {
      const tutorial = Phrases.find(p => p.displayAs === 'Tutorial' && p.tutorialGroup === group);
      const games = Phrases.filter(p => p.displayAs === 'Game' && p.tutorialGroup === group);
      expect(tutorial, `missing tutorial for ${group}`).toBeDefined();
      expect(games.length, `expected game sentences in ${group}`).toBeGreaterThanOrEqual(1);
    }
    const eiwoIndex = Phrases.findIndex(p => p.key === 'feed-seeds');
    const tynuIndex = Phrases.findIndex(p => p.key === 'tynu');
    expect(tynuIndex).toBeGreaterThan(eiwoIndex);
  });

  test('game sentences use realistic capitalization after shift is taught', () => {
    const fdsaIndex = Phrases.findIndex(p => p.key === 'FDSA');
    expect(fdsaIndex).toBeGreaterThan(-1);
    Phrases.forEach((phrase, index) => {
      if (phrase.displayAs !== 'Game' || index < fdsaIndex) {
        return;
      }
      if (/^\d/.test(phrase.value)) {
        return;
      }
      const first = phrase.value[0];
      expect(first, `${phrase.key} should start with an uppercase letter`).toMatch(/[A-Z]/);
    });
  });
});
