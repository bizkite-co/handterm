import React from 'react';
import { Sprite } from './sprites/Sprite';
import { SpriteAnimation } from './types/SpriteTypes';
import { Action, ActionType } from './types/ActionTypes';
import { SpriteManager } from './sprites/SpriteManager';
import { Motion, Position } from './types/Position';

interface BaseCharacterProps {
  position: Position 
}

interface BaseCharacterState {
  
}
export class BaseCharacter extends React.Component<BaseCharacterProps, BaseCharacterState> {
  public context: CanvasRenderingContext2D;
  public sprites: Record<string, Sprite> = {};
  public actions: Record<ActionType, Action>;
  protected sprite: Sprite;
  public currentActionType: ActionType;
  protected frameIndex: number = 0;
  private lastFrameTime: number = 0;
  private frameDelay: number = 500;
  protected velocity: Motion = { dx: 1, dy: 0 };
  protected spriteManager = new SpriteManager();

  constructor(
    context: CanvasRenderingContext2D, 
    actions: Record<ActionType, Action>,
    actionType: ActionType,
    props: BaseCharacterProps
  ) {
    super(props);
    this.currentActionType = actionType;
    this.context = context;
    this.sprite = this.sprites[actionType];
    this.actions = actions;
    this.loadActions(actions);
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
    let spriteFromSprites = this.sprites[this.currentActionType];
    return spriteFromSprites;
  }

  public animate(timestamp: number) {
    this.sprite = this.sprites[this.currentActionType];
    if (this.sprite && timestamp - this.lastFrameTime > this.frameDelay) {
      // Update the frame index
      console.log("Animating: ", this.currentActionType, this.frameIndex);
      this.frameIndex = this.sprite.updateFrameIndex(this.frameIndex, timestamp, this.lastFrameTime, this.frameDelay);

      this.lastFrameTime = timestamp;
    }
  }

  public draw(frameIndex: number, position: Position) {
    const sprite = this.sprites[this.currentActionType];
    if (sprite) {
      sprite.draw(
        this.context,
        frameIndex,
        position.leftX,
        position.topY,
        2
      ); // Example scale factor
    }
  }

  // ...other methods and logic for BaseCharacter
}