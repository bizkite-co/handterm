// SpriteTypes.ts

import { Position } from "./Position";


export type SpriteAnimation = {
  name: string;
  imagePath: string;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  framePositions?: Position[];
};