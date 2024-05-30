// src/terminal/game/CharacterActions.ts

import { SpriteAnimation } from './sprites/SpriteTypes';
import { HeroAnimations } from './characters/hero/HeroAnimations';

// Define the type for the animation keys
export type AnimationKey = 'Idle' | 'Walk' | 'Run' | 'Attack' | 'Hurt' | 'Death';

// Define a type for the combined action and animation
export type CharacterAction = {
  key: AnimationKey;
  animation: SpriteAnimation;
  dx: number;
  dy: number;
};

// Define a Record that maps action keys to their associated action information
export const Actions: Record<AnimationKey, CharacterAction> = {
    Idle: {
        key: 'Idle',
        animation: HeroAnimations.Idle,
        dx: 0,
        dy: 0,
    },
    Walk: {
        key: 'Walk',
        animation: HeroAnimations.Walk,
        dx: 1,
        dy: 0,
    },
    Run: {
        key: 'Run',
        animation: HeroAnimations.Run,
        dx: 2,
        dy: 0,
    },
    Attack: {
        key: 'Attack',
        animation: {
            imagePath: '',
            frameCount: 0,
            frameWidth: 0,
            frameHeight: 0,
            framePositions: undefined
        },
        dx: 0,
        dy: 0
    },
    Hurt: {
        key: 'Attack',
        animation: {
            imagePath: '',
            frameCount: 0,
            frameWidth: 0,
            frameHeight: 0,
            framePositions: undefined
        },
        dx: 0,
        dy: 0
    },
    Death: {
        key: 'Attack',
        animation: {
            imagePath: '',
            frameCount: 0,
            frameWidth: 0,
            frameHeight: 0,
            framePositions: undefined
        },
        dx: 0,
        dy: 0
    }
};