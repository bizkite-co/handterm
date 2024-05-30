import { Sprite } from './Sprite';
import { ZombieActions } from "./Actions"; // Assuming you have this import

export class BaseCharacter {
  protected context: CanvasRenderingContext2D;
  protected sprites: Record<string, Sprite> = {};
  protected currentAnimation: string;
  protected frameIndex: number = 0;
  private lastFrameTime: number = 0;
  private frameDelay: number = 100;
  protected position: { x: number; y: number } = { x: -80, y: 0 };
  protected velocity: { x: number; y: number } = { x: 0, y: 0 };

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
    if (sprite && timestamp - this.lastFrameTime > this.frameDelay) {
      if (this.currentAnimation === ZombieActions.Walk) {
        this.frameIndex = sprite.updateFrameIndex(this.frameIndex, timestamp, this.lastFrameTime, this.frameDelay);
        this.position.x += this.velocity.x; // Move the zombie
        this.lastFrameTime = timestamp;
      }
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