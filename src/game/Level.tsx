// Level.tsx
import React from 'react';
import ParallaxBackground, { ParallaxLayer } from './ParallaxBackground';

interface ILevelProps {
  level: number;
  backgroundOffsetX: number;
  canvasWidth: number;
  canvasHeight: number;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const Level: React.FC<ILevelProps> = ({ level, backgroundOffsetX, canvasWidth, canvasHeight, canvasRef }) => {
  // Function to get parallax layers based on the level
  const getParallaxLayers = (level: number): ParallaxLayer[] => {
    const layers: ParallaxLayer[][] = [
      // Level 1 layers
      [
        { imageSrc: '/images/parallax-industrial-pack/parallax-industrial-pack/layers/skill-desc_0000_foreground.png', scale: 1, movementRate: 1 },
        { imageSrc: '/images/parallax-industrial-pack/parallax-industrial-pack/layers/skill-desc_0001_buildings.png', scale: 0.8, movementRate: 0.6 },
        { imageSrc: '/images/parallax-industrial-pack/parallax-industrial-pack/layers/skill-desc_0002_far-buildings.png', scale: 0.6, movementRate: 0.4 },
      ],
      // Level 2 layers
      [
        { imageSrc: '/images/cyberpunk-street-files/cyberpunk-street-files/PNG/layers/foreground.png', scale: 1, movementRate: 1 },
        { imageSrc: '/images/cyberpunk-street-files/cyberpunk-street-files/PNG/layers/back-buildings.png', scale: 0.8, movementRate: 0.6 },
        { imageSrc: '/images/cyberpunk-street-files/cyberpunk-street-files/PNG/layers/far-buildings.png', scale: 0.6, movementRate: 0.4 },
      ],
      // Add more levels as needed
    ];

    // Ensure the level index is within bounds, defaulting to level 1 if out of bounds
    const levelIndex = level - 1; // Adjust for zero-based index
    return layers[levelIndex] || layers[0];
  };

  // Use getParallaxLayers to get the layers for the current level
  const layers = getParallaxLayers(level);

  return (
    <>
      <ParallaxBackground 
        layers={layers} 
        offset={backgroundOffsetX} 
        canvasWidth={canvasWidth} 
        canvasHeight={canvasHeight} 
        canvasRef={canvasRef}
        />
      {/* Render your characters and other level elements here */}
    </>
  );
};
