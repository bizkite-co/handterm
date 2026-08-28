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
