// SpriteTypes.ts

import { SpritePosition } from "./Position";


export type SpriteAnimation = {
  name: string;
  imagePath: string;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  framePositions?: SpritePosition[];
};