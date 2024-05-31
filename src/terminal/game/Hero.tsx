import { BaseCharacter } from "./BaseCharacter";
import { HeroActions } from "./ActionTypes";



export class Hero extends BaseCharacter {
  constructor(context: CanvasRenderingContext2D) {
    super(context);
    this.loadActions(HeroActions);
  }

  // Remove the override of animate as it's no longer needed.
}