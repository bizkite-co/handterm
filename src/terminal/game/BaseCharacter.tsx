import React from 'react';
import { Sprite } from './sprites/Sprite';
import { SpriteAnimation } from './types/SpriteTypes';
import { Action, ActionType } from './types/ActionTypes';
import { SpriteManager } from './sprites/SpriteManager';
import { Motion, SpritePosition as SpritePosition } from './types/Position';

interface BaseCharacterProps {
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
  private lastFrameTime: number = Date.now();
  private frameDelay: number = 150;
  protected velocity: Motion = { dx: 1, dy: 0 };
  protected spriteManager = new SpriteManager();
  private animationFrameId: number | null = null;
  public position: SpritePosition;
  public name: string;

  constructor(
    context: CanvasRenderingContext2D,
    actions: Record<ActionType, Action>,
    actionType: ActionType,
    position: SpritePosition,
    name: string,
    props: BaseCharacterProps = {}
  ) {
    super(props);
    this.currentActionType = actionType;
    this.context = context;
    this.sprite = this.sprites[actionType];
    this.actions = actions;
    this.loadActions(actions);
    this.name = name;
    this.position = position;
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
    if(this.name === "Hero" && this.sprite?.image) console.log("Character", this.name, "set current action type to", newActionType, "Sprite", this.sprite.image.src);
  }

  public getCurrentActionType(): ActionType {
    // Assuming currentAction is of type Action and has a key property
    return this.currentActionType;
  }

  public getCurrentAction(): Action {
    return this.actions[this.currentActionType];
  }

  public getSprite(): Sprite {
    // Just return the current sprite
    let spriteFromSprites = this.sprites[this.currentActionType];
    return spriteFromSprites;
  }

  public updatePositionAndAnimate(callback: (newPosition: SpritePosition) => void, canvasWidth: number, isInScrollMode: boolean) {
    const animate = () => {
      const now = Date.now();
      const elapsed = now - this.lastFrameTime;
      if (!isInScrollMode || this.name !== "Hero") {
        // Update position based on the current action's dx and dy
        const currentAction = this.getCurrentAction();
        this.position.leftX = this.position.leftX > canvasWidth
          ? -30
          : this.position.leftX + (currentAction.dx / 4);
        this.position.topY += currentAction.dy;

        // Inform the parent component of the position update
        callback(this.position);
      }

      if (elapsed > this.frameDelay) {
        const sprite = this.getSprite();
        if (sprite && sprite.frameCount) {
          this.frameIndex = (this.frameIndex + 1) % sprite.frameCount;
        }

        // Update lastFrameTime only when a new frame is drawn
        this.lastFrameTime = now;
      }


      // Draw the character at the new position with the current frameIndex
      this.draw(this.frameIndex, this.position);

      // Continue the animation loop
      this.animationFrameId = requestAnimationFrame(animate);
    };

    // Initialize the animation loop
    this.animationFrameId = requestAnimationFrame(animate);
  }

  public stopAnimation() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  public draw(frameIndex: number, position: SpritePosition) {
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