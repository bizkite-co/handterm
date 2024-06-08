// Hero.tsx

import { BaseCharacter } from "./BaseCharacter";
import { ActionType, HeroActions } from "./types/ActionTypes";
import { SpritePosition } from "./types/Position";

export class Hero extends BaseCharacter {
  constructor(context: CanvasRenderingContext2D, actionType: ActionType, position: SpritePosition) {
    super(context, HeroActions, actionType, position, "Hero");
  }

  // Remove the override of animate as it's no longer needed.
}