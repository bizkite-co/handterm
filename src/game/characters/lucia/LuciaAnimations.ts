import { type SpriteAnimation } from '../../types/SpriteTypes';

// Lucia (from the "village-robot-invasion" theme character sheet).
// Each action is a horizontal strip of same-size 579x738 cells, assembled from
// individually-authored frames (public/images/Lucia/Individual Sprites/lucia-<action>-NN.png)
// by scripts/assemble-lucia-sprites.sh.
//
// Frame counts currently bootstrap from the single static sheet poses (small
// synthetic step/bounce between copies) and are meant to be replaced with real
// drawn frames — add/adjust files in "Individual Sprites" and re-assemble.

function strip(name: string, frameCount: number): SpriteAnimation {
    return {
        imagePath: `/images/Lucia/Sprites/${name}.png`,
        frameCount,
        frameWidth: 579,
        frameHeight: 738,
    } as SpriteAnimation;
}

export const LuciaAnimations = {
    Idle: strip('Idle', 4),
    Walk: strip('Walk', 6),
    Run: strip('Run', 6),
    Jump: strip('Jump', 3),
    Attack: strip('Attack', 4),
    Hurt: strip('Hurt', 3),
    Death: strip('Death', 6),
    Summersault: strip('Summersault', 4),
};