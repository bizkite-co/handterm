import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  prefetchChordGlyphs,
  prefetchPhraseGlyphs,
  getPrioritizedChordCodes,
  clearPrefetchCacheForTesting,
} from '../prefetchImages';

describe('prefetchImages', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearPrefetchCacheForTesting();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('orders tutorial phrases ahead of general chords', () => {
    const codes = getPrioritizedChordCodes();
    expect(codes.length).toBeGreaterThan(100);

    // Enter key (tutorial 1: '\r') and fdsa chords should be at or near the beginning
    const enterIndex = codes.indexOf('0'); // '\r' chordCode is '0'
    const fIndex = codes.indexOf('1');     // 'f' chordCode is '1'
    expect(enterIndex).toBeGreaterThanOrEqual(0);
    expect(enterIndex).toBeLessThan(15);
    expect(fIndex).toBeGreaterThanOrEqual(0);
    expect(fIndex).toBeLessThan(15);
  });

  it('prefetches phrase glyphs with high priority immediately', () => {
    const createdImages: { src: string; fetchPriority?: string }[] = [];

    // Spy on Image constructor
    const originalImage = globalThis.Image;
    globalThis.Image = class MockImage {
      src = '';
      decoding = 'async';
      fetchPriority?: string;
      constructor() {
        createdImages.push(this);
      }
    } as unknown as typeof Image;

    try {
      prefetchPhraseGlyphs({
        key: 'fd',
        value: 'Test phrase',
        displayAs: 'Tutorial',
      });

      expect(createdImages.length).toBeGreaterThan(0);
      expect(createdImages.some((img) => img.src.includes('1.svg'))).toBe(true);
    } finally {
      globalThis.Image = originalImage;
    }
  });

  it('batches background prefetch without blocking', () => {
    const createdImages: string[] = [];

    const originalImage = globalThis.Image;
    globalThis.Image = class MockImage {
      _src = '';
      decoding = 'async';
      set src(val: string) {
        this._src = val;
        createdImages.push(val);
      }
      get src() {
        return this._src;
      }
    } as unknown as typeof Image;

    try {
      prefetchChordGlyphs();

      // Immediate initial batch should be fired
      expect(createdImages.length).toBeGreaterThanOrEqual(12);

      const countBeforeTimers = createdImages.length;
      // Fast forward time to let throttled batches run
      vi.advanceTimersByTime(200);

      expect(createdImages.length).toBeGreaterThan(countBeforeTimers);
    } finally {
      globalThis.Image = originalImage;
    }
  });
});
