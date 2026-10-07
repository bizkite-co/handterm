// ActionTypes.ts
import { type  ActionType } from '@handterm/types';
export type { ActionType };
import { LuciaAnimations } from '../characters/lucia/LuciaAnimations';
import { Zombie4Animations } from '../characters/zombie4/Zombie4Animations';

import { type SpriteAnimation } from './SpriteTypes';

export type Action = {
  animation: SpriteAnimation;
  dx: number;
  dy: number;
  continueous: boolean;
};

export const HeroActions: Record<ActionType, Action> = {
  Run: {
    animation: LuciaAnimations.Run,
    dx: 2,
    dy: 0,
    continueous: true,
  },
  Idle: {
    animation: LuciaAnimations.Idle,
    dx: 0,
    dy: 0,
    continueous: true,
  },
  Walk: {
    animation: LuciaAnimations.Walk,
    dx: 1,
    dy: 0,
    continueous: true,
  },
  Jump: {
    animation: LuciaAnimations.Jump,
    dx: 0,
    dy: 0,
    continueous: false
  },
  Attack: {
    animation: LuciaAnimations.Attack,
    dx: 0,
    dy: 0,
    continueous: false
  },
  Summersault: {
    animation: LuciaAnimations.Summersault,
    dx: 3,
    dy: 1,
    continueous: false
  },
  Death: {
    animation: LuciaAnimations.Death,
    dx: 0,
    dy: 0,
    continueous: false
  },
  Hurt: {
    animation: LuciaAnimations.Hurt,
    dx: 0,
    dy: 0,
    continueous: false
  }
};

export const Zombie4Actions: Record<string, Action> = {
  Attack: {
    animation: Zombie4Animations.Attack, // HeroRunAnimation is imported from HeroAnimations.ts
    dx: 0,
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
  },
  Death: {
    animation: Zombie4Animations.Death, // HeroWalkAnimation is imported from HeroAnimations.ts
    dx: 0,
    dy: 0,
    continueous: false,
  }
};