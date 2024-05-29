import { ZombieActions } from "./Actions";
import { Sprite } from "./Sprite";

export class BaseCharacter {
  protected context: CanvasRenderingContext2D;
  protected sprites: Record<string, Sprite> = {};
  protected currentAnimation: string;
  protected frameIndex: number = 0;
  protected frameCount: number = 0;
  private lastFrameTime: number = 0;
  private frameDelay: number = 100;
  protected position: { x: number; y: number } = { x: -80, y: 0 };
  protected velocity: { x: number; y: number } = { x: 10, y: 0 };

  constructor(context: CanvasRenderingContext2D) {
    this.context = context;
    this.currentAnimation = 'idle';

  }

  protected loadSprite(imagePath: string, animationKey: string, frameCount: number) {
    this.sprites[animationKey] = new Sprite(imagePath, frameCount); 
  }

  public animate(timestamp: number) {
    const sprite = this.sprites[this.currentAnimation];
    if (timestamp - this.lastFrameTime > this.frameDelay && sprite) {
      const frameCount = sprite.frameCount;
      if (this.currentAnimation === ZombieActions.Walk) {
        this.frameIndex = (this.frameIndex + 1) % frameCount; // Loop the animation
        this.position.x += this.velocity.x; // Move the zombie
        // Update the last frame update time
        this.lastFrameTime = timestamp;
      }
    }
  }

  public draw() {
    const animation = this.sprites[this.currentAnimation];
    if (this.context && animation) {
      const sprite = animation.image;
      const frameCount = animation.frameCount;
      const scale = 2.5; // Adjust this scale factor as needed
      const frameWidth = (sprite.width / frameCount) * scale;
      const frameHeight = sprite.height * 1.9;
      const frameX = sprite.width / frameCount * this.frameIndex;

      this.context.drawImage(
        sprite,
        frameX, 0,  // source x, y
        frameWidth / scale, sprite.height,  // source width, height
        this.position.x, this.position.y,  // destination x, y
        frameWidth, frameHeight // destination width, height (scaled)
      );
    }
  }
}