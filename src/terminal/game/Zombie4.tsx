import { BaseCharacter } from './BaseCharacter';
import { Zombie4Actions } from './ActionTypes';

// * Idle - 5 frames
// * Walk - 13 frames
// * Attack - 15 frames
// * Hurt - 7 frames
// * Death - 12 frames
// * Spawn - 10 frames
// There are 6 animations. All frames are on a 62x62 "canvas."

export class Zombie4 extends BaseCharacter {
  constructor(context: CanvasRenderingContext2D) {
    super(context);
    // Load sprites for different animations
    this.loadActions(Zombie4Actions);
    this.velocity.dx = 0.3;
    this.currentAnimation = 'Walk';
  }

  public animate(timestamp: number) {
    super.animate(timestamp);
    // Override with specific logic for Zombie4
    // If the attack animation has finished, switch back to walking and reset frame index
    if (this.currentAnimation === 'Attack' && this.sprite && this.frameIndex === this.sprite.frameCount - 1) {
      this.currentAnimation = 'Walk';
      this.frameIndex = 0; // Reset frame index for walk animation
    }

    // If the current animation is walk, continue moving the zombie
    if (this.currentAnimation === 'Walk') {
      this.position.leftX = this.position.leftX < this.context.canvas.width ? this.position.leftX + this.velocity.dx : -55;
    }
  }
}