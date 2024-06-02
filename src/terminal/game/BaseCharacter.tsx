import { Sprite } from './sprites/Sprite';
import { SpriteAnimation } from './sprites/SpriteTypes';
import { Action, ActionType, HeroActions } from './ActionTypes';
import { SpriteManager } from './sprites/SpriteManager';

export class BaseCharacter {
  protected context: CanvasRenderingContext2D;
  public sprites: Record<string, Sprite> = {};
  public actions: Record<ActionType, Action>;
  protected sprite: Sprite;
  public currentActionType: ActionType;
  protected frameIndex: number = 0;
  private lastFrameTime: number = 0;
  private frameDelay: number = 100;
  protected position: { leftX: number; topY: number } = { leftX: 75, topY: 0 };
  protected velocity: { dx: number; dy: number } = { dx: 1, dy: 0 };
  protected spriteManager = new SpriteManager();

  constructor(
    context: CanvasRenderingContext2D, 
    actions: Record<ActionType, Action>,
    actionType: ActionType,
  ) {
    this.currentActionType = actionType;
    this.context = context;
    this.sprite = this.sprites[actionType];
    this.actions = actions;
    console.log("BaseCharacter: ", this.currentActionType, actions);
    this.loadActions(actions);
    // Assuming you load sprites here or somewhere else
  }

  public async loadSprite(actionKey: ActionType, animationData: SpriteAnimation) {
    const sprite = await this.spriteManager.loadSprite(animationData);
    // console.log("loadSprite", sprite, actionKey, animationData);
    this.sprites[actionKey] = sprite;
    this.sprite = sprite;
  }

  protected loadActions(actions: Record<ActionType, Action>) {
    Object.entries(actions).forEach(([actionKey, actionData]) => {
      this.loadSprite(actionKey as ActionType, actionData.animation);
      // The dx and dy values can be accessed later when needed based on the current action
    });
  }

  public setCurrentActionType(newActionType: ActionType) {
    // Update the current action
    this.currentActionType = newActionType;

    // Update the current sprite to match the new action
    this.sprite = this.sprites[newActionType];
  }

  public getCurrentActionType(): ActionType{
    // Assuming currentAction is of type Action and has a key property
    return this.currentActionType;
  }

  public getCurrentAction(): Action {
    return this.actions[this.currentActionType];
  }

  public getSprite() : Sprite {
    // Just return the current sprite
    return this.sprite;
  }

  public animate(timestamp: number) {
    this.sprite = this.sprites[this.currentActionType];
    if (this.sprite && timestamp - this.lastFrameTime > this.frameDelay) {

      // Update the frame index
      this.frameIndex = this.sprite.updateFrameIndex(this.frameIndex, timestamp, this.lastFrameTime, this.frameDelay);

      this.lastFrameTime = timestamp;
    }
  }

  public draw() {
    const sprite = this.sprites[this.currentActionType];
    if (sprite) {
      sprite.draw(
        this.context,
        this.frameIndex,
        this.position.leftX,
        this.position.topY,
        2
      ); // Example scale factor
    }
  }

  // ...other methods and logic for BaseCharacter
}