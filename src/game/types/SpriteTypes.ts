// SpriteTypes.ts

import { ActionType } from "./ActionTypes";
import { SpritePosition } from "./Position";


export type SpriteAnimation = {
  name: ActionType;
  imagePath: string;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  framePositions?: SpritePosition[];
};