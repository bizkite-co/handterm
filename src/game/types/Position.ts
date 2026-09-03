export interface SpritePosition {
    leftX: number,
    topY: number
}

/**
 * The horizontal footprint of a character's visible body in world pixels,
 * relative to the character's drawn leftX. `left` is the offset from the
 * drawn leftX to the body's left edge; `width` is the body's width. This lets
 * the game test "touching" body-edge-to-body-edge instead of comparing frame
 * cell edges (which include sprite padding and per-character xOffset).
 */
export interface CharacterHitbox {
    left: number,
    width: number,
}

export interface FramePostion {
    leftX: number,
    topY: number
}

export interface Motion {
    dx: number,
    dy: number
}