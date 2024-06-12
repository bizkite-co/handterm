// Level.tsx
import { IParallaxLayer } from './ParallaxLayer';

export const layers: IParallaxLayer[][] = [
  // Level 1 layers
  [
    { imageSrc: '/images/parallax-industrial-pack/parallax-industrial-pack/layers/skill-desc_0002_far-buildings.png', scale: 0.8, movementRate: 0.4 },
    { imageSrc: '/images/parallax-industrial-pack/parallax-industrial-pack/layers/skill-desc_0001_buildings.png', scale: 0.6, movementRate: 0.6 },
    { imageSrc: '/images/parallax-industrial-pack/parallax-industrial-pack/layers/skill-desc_0000_foreground.png', scale: 0.6, movementRate: 1 },
  ],
  // Level 2 layers
  [
    { imageSrc: '/images/cyberpunk-street-files/cyberpunk-street-files/PNG/layers/far-buildings.png', scale: 0.6, movementRate: 0.4 },
    { imageSrc: '/images/cyberpunk-street-files/cyberpunk-street-files/PNG/layers/back-buildings.png', scale: 0.8, movementRate: 0.6 },
    { imageSrc: '/images/cyberpunk-street-files/cyberpunk-street-files/PNG/layers/foreground.png', scale: 1, movementRate: 1 },
  ],
  // Add more levels as needed
];


export const getLevelCount = (): number => {
  return layers.length;
}
