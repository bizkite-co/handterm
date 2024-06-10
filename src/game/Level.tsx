// Level.tsx
import React from 'react';
import {ParallaxBackground,  IParallaxLayer } from './ParallaxBackground';

interface ILevelProps {
  level: number;
  backgroundOffsetX: number;
  canvasWidth: number;
  canvasHeight: number;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const getParallaxLayers = (level: number): IParallaxLayer[] => {
  const layers: IParallaxLayer[][] = [
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

  // console.log('getParallaxLayers called with level:', level);
  // Ensure the level index is within bounds, defaulting to level 1 if out of bounds
  const levelIndex = level - 1; // Adjust for zero-based index
  return layers[levelIndex] || layers[0];
};

export const Level: React.FC<ILevelProps> = ({ level, backgroundOffsetX, canvasWidth, canvasHeight, canvasRef }) => {
  const layers = React.useMemo(() => {

    // Function to get parallax layers based on the level
    // Use getParallaxLayers to get the layers for the current level
    return getParallaxLayers(level);
  }, [level]);

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
