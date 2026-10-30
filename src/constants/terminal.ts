export const TERMINAL_CONSTANTS = {
  PROMPT: '> ',
  PROMPT_LENGTH: 2, // Length of '> '
} as const;

// Base dimensions for the chord glyph (the hand-chord SVG).
// Scale via chordGlyphScale signal / `config chord-glyph-size` command.
export const CHORD_GLYPH_BASE = {
  width: 75,
  height: 59.516,
} as const;

// Injected at build time by Vite (git short hash or timestamp fallback).
declare const __CHORD_VERSION__: string | undefined;
export const CHORD_ASSET_VERSION =
  typeof __CHORD_VERSION__ !== 'undefined' ? __CHORD_VERSION__ : 'dev';

/**
 * Helper to build cache-busted SVG image URLs for chord hand glyphs.
 */
export function getChordSvgUrl(glyphCode: string): string {
  const base = import.meta.env?.BASE_URL ?? '/';
  return `${base}images/svgs/${glyphCode}.svg?v=${CHORD_ASSET_VERSION}`;
}

