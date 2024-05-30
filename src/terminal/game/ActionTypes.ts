// ActionTypes.ts
import { SpriteAnimation } from './sprites/SpriteTypes';
import { HeroAnimations } from './characters/hero/HeroAnimations';
import { Zombie4Animations } from './characters/zombie4/Zobie4Animations';

export type Action = {
  animation: SpriteAnimation;
  dx: number;
  dy: number;
};

export const HeroActions: Record<string, Action> = {
  Run: {
    animation: HeroAnimations.Run, // HeroRunAnimation is imported from HeroAnimations.ts
    dx: 2,
    dy: 0,
  },
  Idle: {
      animation: HeroAnimations.Idle, // HeroIdleAnimation is imported from HeroAnimations.ts
      dx: 0,
      dy: 0,
  },
  Walk: {
      animation: HeroAnimations.Walk, // HeroWalkAnimation is imported from HeroAnimations.ts
      dx: 1,
      dy: 0,
  }
  // Define other actions like Idle, Jump, Attack, etc.
};

export const Zombie4Actions: Record<string, Action> = {
  Attack: {
    animation: Zombie4Animations.Attack, // HeroRunAnimation is imported from HeroAnimations.ts
    dx: 2,
    dy: 0,
  },
  Idle: {
      animation: Zombie4Animations.Idle, // HeroIdleAnimation is imported from HeroAnimations.ts
      dx: 0,
      dy: 0,
  },
  Walk: {
      animation: Zombie4Animations.Walk, // HeroWalkAnimation is imported from HeroAnimations.ts
      dx: 1,
      dy: 0,
  },
  Hurt: {
      animation: Zombie4Animations.Hurt, // HeroWalkAnimation is imported from HeroAnimations.ts
      dx: 0,
      dy: 0,
  }
  // Define other actions like Idle, Jump, Attack, etc.
};