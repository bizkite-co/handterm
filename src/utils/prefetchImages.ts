import { allChords } from '../allChords';
import { Phrases, type GamePhrase } from '@handterm/types';
import { getChordSvgUrl } from '../constants/terminal';

const EXTRA_GLYPHS = ['enter-key', 'backspace-key'];
const BATCH_SIZE = 4;
const BATCH_INTERVAL_MS = 60;

const prefetchedUrls = new Set<string>();

function findChordCodeForChar(char: string): string | undefined {
  const match = allChords.find(
    (c) =>
      c.key === char ||
      c.alias === char ||
      c.key.replace('&#x2581;', ' ') === char ||
      c.key.replace('(underscore)', '_') === char
  );
  return match?.chordCode;
}

function prefetchSingleUrl(url: string, highPriority = false): void {
  if (prefetchedUrls.has(url)) return;
  prefetchedUrls.add(url);

  const img = new Image();
  img.decoding = 'async';
  if (highPriority && 'fetchPriority' in img) {
    // Hint supported browsers to bump network priority for critical level chords
    (img as HTMLImageElement & { fetchPriority: string }).fetchPriority = 'high';
  }
  img.src = url;
}

/**
 * Immediately prefetches chord glyphs for a specific phrase or character string.
 * Call this when a tutorial step or game level is displayed or queued to ensure
 * its glyphs are loaded ahead of typing without waiting for the background queue.
 */
export function prefetchPhraseGlyphs(phraseOrText: GamePhrase | string | null | undefined): void {
  if (!phraseOrText) return;
  const key = typeof phraseOrText === 'string' ? phraseOrText : phraseOrText.key;
  if (!key) return;

  for (const ch of key) {
    const code = findChordCodeForChar(ch);
    if (code) {
      prefetchSingleUrl(getChordSvgUrl(code), true);
    }
  }
}

/**
 * Builds the prioritized list of chord codes:
 * 1. Tutorial phrases (in curriculum order)
 * 2. Essential extra glyphs (enter, backspace)
 * 3. All remaining chords in allChords
 */
export function getPrioritizedChordCodes(): string[] {
  const orderedCodes: string[] = [];
  const seenCodes = new Set<string>();

  const addCode = (code: string | undefined) => {
    if (code && !seenCodes.has(code)) {
      seenCodes.add(code);
      orderedCodes.push(code);
    }
  };

  // 1. Tutorial phrase chords first
  const tutorialPhrases = Phrases.filter((p) => p.displayAs === 'Tutorial');
  for (const phrase of tutorialPhrases) {
    for (const ch of phrase.key) {
      addCode(findChordCodeForChar(ch));
    }
  }

  // 2. Extra key glyphs
  for (const name of EXTRA_GLYPHS) {
    addCode(name);
  }

  // 3. All remaining chords in the system
  for (const chord of allChords) {
    addCode(chord.chordCode);
  }

  return orderedCodes;
}

/**
 * Warms the browser cache for chord SVGs in a prioritized, throttled background queue.
 *
 * First priority (all tutorial glyphs + extras) are prefetched first.
 * The remainder are batched quietly using requestIdleCallback / setTimeout
 * so they never choke the mobile network or delay active game/tutorial UI requests.
 */
export function clearPrefetchCacheForTesting(): void {
  prefetchedUrls.clear();
}

export function prefetchChordGlyphs(): void {
  const prioritizedCodes = getPrioritizedChordCodes();
  const queue = prioritizedCodes.map((code) => getChordSvgUrl(code));

  // Eagerly prefetch the first batch of initial tutorial chords right away
  const initialBatchCount = 12;
  const initial = queue.splice(0, initialBatchCount);
  for (const url of initial) {
    prefetchSingleUrl(url, true);
  }

  // Process the remainder in small batches during idle intervals
  function processQueue(): void {
    if (queue.length === 0) return;

    const batch = queue.splice(0, BATCH_SIZE);
    for (const url of batch) {
      prefetchSingleUrl(url, false);
    }

    if (queue.length > 0) {
      scheduleNextBatch();
    }
  }

  function scheduleNextBatch(): void {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => processQueue(), { timeout: BATCH_INTERVAL_MS * 2 });
    } else {
      setTimeout(processQueue, BATCH_INTERVAL_MS);
    }
  }

  scheduleNextBatch();
}
