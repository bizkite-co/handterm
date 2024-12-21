// SpriteTypes.ts

import { type ActionType } from "./ActionTypes";
import { type SpritePosition } from "./Position";


export interface SpriteAnimation {
  name: ActionType;
  imagePath: string;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  framePositions?: SpritePosition[];
}