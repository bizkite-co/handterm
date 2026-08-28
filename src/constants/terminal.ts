export const TERMINAL_CONSTANTS = {
  PROMPT: '> ',
  PROMPT_LENGTH: 2, // Length of '> '
} as const;

// Base dimensions for the handshape glyph (the hand-chord SVG).
// Scale via HANDSHAPE_SCALE signal / `config handshape-size` command.
export const HANDSHAPE_BASE = {
  width: 75,
  height: 59.516,
} as const;
