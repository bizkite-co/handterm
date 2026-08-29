import { describe, it, expect } from 'vitest';

import {
  getNextGamePhrase,
  setCompletedGamePhrase,
  completedGamePhrasesSignal,
} from '../signals/gameSignals';

describe('gameSignals', () => {
  it('getNextGamePhrase only returns Game phrases, never Tutorial text', () => {
    const next = getNextGamePhrase();
    expect(next).not.toBeNull();
    expect(next?.displayAs).toBe('Game');
    // The first Tutorial phrase ('\r' intro) must never be returned here
    expect(next?.displayAs).not.toBe('Tutorial');
  });

  it('returns the next incomplete Game phrase after the current one is completed', () => {
    const first = getNextGamePhrase();
    expect(first).not.toBeNull();
    if (first === null) return;

    setCompletedGamePhrase(first.key);

    const second = getNextGamePhrase();
    expect(second).not.toBeNull();
    expect(second?.key).not.toBe(first.key);
    expect(second?.displayAs).toBe('Game');
  });

  it('returns null once every Game phrase is completed', () => {
    let next = getNextGamePhrase();
    while (next !== null) {
      setCompletedGamePhrase(next.key);
      next = getNextGamePhrase();
    }
    expect(next).toBeNull();
  });

  it('marks phrases completed persistently', () => {
    const next = getNextGamePhrase();
    if (next === null) return;
    setCompletedGamePhrase(next.key);
    expect(completedGamePhrasesSignal.value.has(next.key)).toBe(true);
  });
});