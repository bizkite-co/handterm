// SpriteTypes.ts

import { SpritePostion } from "./Position";


export type SpriteAnimation = {
  name: string;
  imagePath: string;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  framePositions?: SpritePostion[];
};