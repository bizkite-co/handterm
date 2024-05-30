import { BaseCharacter } from './BaseCharacter';
import { ZombieActions } from './Actions';

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
    this.loadSprite('images/Zombie4Package/Sprites/Idle.png', 'idle', 5);
    this.loadSprite('images/Zombie4Package/Sprites/Walk.png', 'walk', 13);
    this.loadSprite('images/Zombie4Package/Sprites/Attack.png', 'attack', 15);
    this.loadSprite('images/Zombie4Package/Sprites/Hurt.png', 'hurt', 7);
    this.loadSprite('images/Zombie4Package/Sprites/Death.png', 'death', 12);
    this.loadSprite('images/Zombie4Package/Sprites/Spawn.png', 'spawn', 10);
    this.velocity.x = 1;
    this.currentAnimation = ZombieActions.Walk;
  }

  public animate(timestamp: number) {
    super.animate(timestamp);
    // Override with specific logic for Zombie4
  }
}