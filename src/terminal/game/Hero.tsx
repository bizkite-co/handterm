// Hero.tsx

import { BaseCharacter } from "./BaseCharacter";
import { ActionType, HeroActions } from "./types/ActionTypes";
import { SpritePostion } from "./types/Position";

export class Hero extends BaseCharacter {
  constructor(context: CanvasRenderingContext2D, actionType: ActionType, position: SpritePostion) {
    super(context, HeroActions, actionType, {position});
  }

  // Remove the override of animate as it's no longer needed.
}