import { Sprite } from './sprites/Sprite';
import { SpriteAnimation } from './sprites/SpriteTypes';
import { Action } from './ActionTypes';
import { AnimationKey } from './CharacterActions';

export class BaseCharacter {
  protected context: CanvasRenderingContext2D;
  protected sprites: Record<string, Sprite> = {};
  protected sprite: Sprite | null = null;
  protected currentAnimation: AnimationKey ;
  protected frameIndex: number = 0;
  private lastFrameTime: number = 0;
  private frameDelay: number = 100;
  protected position: { leftX: number; topY: number } = { leftX: 75, topY: 0 };
  protected velocity: { dx: number; dy: number } = { dx: 1, dy: 0 };

  constructor(context: CanvasRenderingContext2D) {
    this.context = context;
    this.currentAnimation = 'Idle';
    // Assuming you load sprites here or somewhere else
  }

  protected loadSprite(actionKey: string, animationData: SpriteAnimation) {
    const { imagePath, frameCount, frameWidth, frameHeight, framePositions } = animationData;
    const sprite = new Sprite(imagePath, frameCount, frameWidth, frameHeight, framePositions);
    this.sprites[actionKey] = sprite;
  }

  protected loadActions(actions: Record<string, Action>) {
    Object.entries(actions).forEach(([actionKey, actionData]) => {
      const { animation } = actionData;
      this.loadSprite(actionKey, animation);
      // The dx and dy values can be accessed later when needed based on the current action
    });
  }

  public animate(timestamp: number) {
    this.sprite = this.sprites[this.currentAnimation];
    if (this.sprite && timestamp - this.lastFrameTime > this.frameDelay) {

      // Update the frame index
      this.frameIndex = this.sprite.updateFrameIndex(this.frameIndex, timestamp, this.lastFrameTime, this.frameDelay);

      this.lastFrameTime = timestamp;
    }
  }

  public draw() {
    const sprite = this.sprites[this.currentAnimation];
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