// SpriteTypes.ts

export type FramePosition = {
  leftX: number;
  topY: number;
};

export type SpriteAnimation = {
  name: string;
  imagePath: string;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  framePositions?: FramePosition[];
};