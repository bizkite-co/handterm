// Hero.tsx

import { BaseCharacter } from "./BaseCharacter";
import { ActionType, HeroActions } from "./ActionTypes";

export class Hero extends BaseCharacter {
  constructor(context: CanvasRenderingContext2D, actionType: ActionType) {
    super(context, HeroActions, actionType);
  }

  // Remove the override of animate as it's no longer needed.
}