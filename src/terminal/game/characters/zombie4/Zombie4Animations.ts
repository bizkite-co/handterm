import { SpriteAnimation } from "../../types/SpriteTypes";

// * Idle - 5 frames
// * Walk - 13 frames
// * Attack - 15 frames
// * Hurt - 7 frames
// * Death - 12 frames
// * Spawn - 10 frames

export const Zombie4Animations = {
    Idle: {
        imagePath: 'images/Zombie4Package/Sprites/Idle.png',
        frameCount: 5,
        frameWidth: 62,
        frameHeight: 62,
    } as SpriteAnimation,
    Walk: {
        imagePath: 'images/Zombie4Package/Sprites/Walk.png',
        frameCount: 13,
        frameWidth: 62,
        frameHeight: 62,
    } as SpriteAnimation,
    Attack: {
        imagePath: 'images/Zombie4Package/Sprites/Attack.png',
        frameCount: 15,
        frameWidth: 62,
        frameHeight: 62,
    } as SpriteAnimation,
    Hurt: {
        imagePath: 'images/Zombie4Package/Sprites/Hurt.png',
        frameCount: 7,
        frameWidth: 62,
        frameHeight: 62,
    } as SpriteAnimation,
    Death: {
        imagePath: 'images/Zombie4Package/Sprites/Death.png',
        frameCount: 12,
        frameWidth: 62,
        frameHeight: 62,
    } as SpriteAnimation,
    Spawn: {
        imagePath: 'images/Zombie4Package/Sprites/Spawn.png',
        frameCount: 10,
        frameWidth: 62,
        frameHeight: 62,
    } as SpriteAnimation,
}