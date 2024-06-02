// ActionTypes.ts
import { SpriteAnimation } from './sprites/SpriteTypes';
import { HeroAnimations } from './characters/hero/HeroAnimations';
import { Zombie4Animations } from './characters/zombie4/Zobie4Animations';

export type Action = {
  animation: SpriteAnimation;
  dx: number;
  dy: number;
  continueous: boolean;
};

const ActionType = {
  Run: 'Run',
  Idle: 'Idle',
  Walk: 'Walk',
  Jump: 'Jump',
  Attack: 'Attack',
  Die: 'Die',
  Hurt: 'Hurt',
} as const;

export type ActionType = typeof ActionType[keyof typeof ActionType];

export const HeroActions: Record<ActionType, Action> = {
  Run: {
    animation: HeroAnimations.Run, // HeroRunAnimation is imported from HeroAnimations.ts
    dx: 2,
    dy: 0,
    continueous: true,
  },
  Idle: {
    animation: HeroAnimations.Idle, // HeroIdleAnimation is imported from HeroAnimations.ts
    dx: 0,
    dy: 0,
    continueous: true,
  },
  Walk: {
    animation: HeroAnimations.Walk, // HeroWalkAnimation is imported from HeroAnimations.ts
    dx: 1,
    dy: 0,
    continueous: true,
  },
  Jump: {
    animation: HeroAnimations.Jump,
    dx: 0,
    dy: 0,
    continueous: false
  },
  Attack: {
    animation: HeroAnimations.Attack,
    dx: 0,
    dy: 0,
    continueous: false
  },
  Die: {
    animation: HeroAnimations.Die,
    dx: 0,
    dy: 0,
    continueous: false
  },
  Hurt: {
    animation: HeroAnimations.Hurt,
    dx: 0,
    dy: 0,
    continueous: false
  }
};

export const Zombie4Actions: Record<string, Action> = {
  Attack: {
    animation: Zombie4Animations.Attack, // HeroRunAnimation is imported from HeroAnimations.ts
    dx: 2,
    dy: 0,
    continueous: false,
  },
  Idle: {
      animation: Zombie4Animations.Idle, // HeroIdleAnimation is imported from HeroAnimations.ts
      dx: 0,
      dy: 0,
      continueous: true,
  },
  Walk: {
      animation: Zombie4Animations.Walk, // HeroWalkAnimation is imported from HeroAnimations.ts
      dx: 1,
      dy: 0,
      continueous: true,
  },
  Hurt: {
      animation: Zombie4Animations.Hurt, // HeroWalkAnimation is imported from HeroAnimations.ts
      dx: 0,
      dy: 0,
      continueous: false,
  }
};