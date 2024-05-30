// SpriteTypes.ts
export type FramePosition = {
  leftX: number;
  topY: number;
};

export type SpriteAnimation = {
  imagePath: string;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  framePositions?: FramePosition[];
};