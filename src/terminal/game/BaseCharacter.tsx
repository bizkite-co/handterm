import { Sprite } from './Sprite';
import { ZombieActions } from "./Actions"; // Assuming you have this import

export class BaseCharacter {
  protected context: CanvasRenderingContext2D;
  protected sprites: Record<string, Sprite> = {};
  protected currentAnimation: string;
  protected frameIndex: number = 0;
  private lastFrameTime: number = 0;
  private frameDelay: number = 100;
  protected position: { x: number; y: number } = { x: -75, y: 0 };
  protected velocity: { x: number; y: number } = { x: 1, y: 0 };

  constructor(context: CanvasRenderingContext2D) {
    this.context = context;
    this.currentAnimation = 'idle';
    // Assuming you load sprites here or somewhere else
  }

  protected loadSprite(imagePath: string, animationKey: string, frameCount: number) {
    const sprite = new Sprite(imagePath, frameCount);
    this.sprites[animationKey] = sprite;
  }

  public animate(timestamp: number) {
    const sprite = this.sprites[this.currentAnimation];
    const attackEvery = 60;
    if (sprite && timestamp - this.lastFrameTime > this.frameDelay) {
      // Check if the zombie's x position is a multiple of 20 and if it's not already attacking
      if (this.position.x % attackEvery === 0 && this.currentAnimation !== ZombieActions.Attack) {
        this.currentAnimation = ZombieActions.Attack;
        this.frameIndex = 0; // Reset frame index for attack animation
      } else if (this.position.x % attackEvery !== 0 && this.currentAnimation !== ZombieActions.Walk) {
        this.currentAnimation = ZombieActions.Walk;
        this.frameIndex = 0; // Reset frame index for walk animation
      }

      // Update the frame index
      this.frameIndex = sprite.updateFrameIndex(this.frameIndex, timestamp, this.lastFrameTime, this.frameDelay);

      // If the attack animation has finished, switch back to walking and reset frame index
      if (this.currentAnimation === ZombieActions.Attack && this.frameIndex === sprite.frameCount - 1) {
        this.currentAnimation = ZombieActions.Walk;
        this.frameIndex = 0; // Reset frame index for walk animation
      }

      // If the current animation is walk, continue moving the zombie
      if (this.currentAnimation === ZombieActions.Walk) {
        this.position.x += this.velocity.x;
      }

      this.lastFrameTime = timestamp;
    }
  }

  public draw() {
    const sprite = this.sprites[this.currentAnimation];
    if (sprite) {
      sprite.draw(this.context, this.frameIndex, this.position.x, this.position.y, 2); // Example scale factor
    }
  }

  // ...other methods and logic for BaseCharacter
}