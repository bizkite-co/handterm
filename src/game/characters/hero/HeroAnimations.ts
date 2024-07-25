// HeroAnimations.ts
import { SpriteAnimation } from '../../types/SpriteTypes';

export const HeroAnimations = {
    Run: {
        imagePath: '/images/Adventurer/Adventurer-1.5/adventurer-v1.5-Sheet.png',
        frameCount: 6,
        frameWidth: 50,
        frameHeight: 37,
        framePositions: [
            { leftX: 50, topY: 37 },
            { leftX: 100, topY: 37 },
            { leftX: 150, topY: 37 },
            { leftX: 200, topY: 37 },
            { leftX: 250, topY: 37 },
            { leftX: 300, topY: 37 },
        ],
    } as SpriteAnimation,
    Idle: {
        imagePath: '/images/Adventurer/Adventurer-1.5/adventurer-v1.5-Sheet.png',
        frameCount: 4,
        frameWidth: 50,
        frameHeight: 37,
        framePositions: [
            { leftX: 0, topY: 0 },
            { leftX: 50, topY: 0 },
            { leftX: 100, topY: 0 },
            { leftX: 150, topY: 0 },
        ],
    } as SpriteAnimation,
    Walk: {
        imagePath: '/images/Adventurer/Adventurer-1.5/adventurer-v1.5-Sheet.png',
        frameCount: 4,
        frameWidth: 50,
        frameHeight: 37,
        framePositions: [
            { leftX: 0, topY: 0 },
            { leftX: 50, topY: 0 },
            { leftX: 100, topY: 0 },
            { leftX: 150, topY: 0 },
        ],
    } as SpriteAnimation,
    Attack: {
        imagePath: '/images/Adventurer/Adventurer-1.5/adventurer-v1.5-Sheet.png',
        frameCount: 4,
        frameWidth: 50,
        frameHeight: 37,
        framePositions: [
            { leftX: 0, topY: 0 },
            { leftX: 50, topY: 0 },
            { leftX: 100, topY: 0 },
            { leftX: 150, topY: 0 },
        ],
    } as SpriteAnimation,
    Summersault: {
        imagePath: '/images/Adventurer/Adventurer-1.5/adventurer-v1.5-Sheet.png',
        frameCount: 4,
        frameWidth: 50,
        frameHeight: 37,
        framePositions: [
            { leftX: 200, topY: 74 },
            { leftX: 250, topY: 74 },
            { leftX: 300, topY: 74 },
            { leftX: 0, topY: 106 },
        ],
    } as SpriteAnimation,
    Hurt: {
        imagePath: '/images/Adventurer/Adventurer-1.5/adventurer-v1.5-Sheet.png',
        frameCount: 3,
        frameWidth: 50,
        frameHeight: 37,
        framePositions: [
            { leftX: 150, topY: 296 },
            { leftX: 200, topY: 296 },
            { leftX: 250, topY: 296 },
        ],
    } as SpriteAnimation,
    Death: {
        imagePath: '/images/Adventurer/Adventurer-1.5/adventurer-v1.5-Sheet.png',
        frameCount: 6,
        frameWidth: 50,
        frameHeight: 37,
        framePositions: [
            { leftX: 300, topY: 296 },
            { leftX: 0, topY: 333 },
            { leftX: 50, topY: 333 },
            { leftX: 100, topY: 333 },
            { leftX: 150, topY: 333 },
            { leftX: 200, topY: 333 },
        ],
    } as SpriteAnimation,
    Jump: {
        imagePath: '/images/Adventurer/Adventurer-1.5/adventurer-v1.5-Sheet.png',
        frameCount: 4,
        frameWidth: 50,
        frameHeight: 37,
        framePositions: [
            { leftX: 0, topY: 0 },
            { leftX: 50, topY: 0 },
            { leftX: 100, topY: 0 },
            { leftX: 150, topY: 0 },
        ],
    } as SpriteAnimation,
};

// You can define more animations here