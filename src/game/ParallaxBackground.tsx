// ParallaxBackground.tsx
import React, { useEffect } from 'react';

export interface ParallaxLayer {
  imageSrc: string;
  scale: number;
  movementRate: number;
}

export interface ParallaxBackgroundProps {
  layers: ParallaxLayer[];
  offset: number; // This prop is the backgroundOffsetX from your game state
  canvasWidth: number;
  canvasHeight: number;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const ParallaxBackground: React.FC<ParallaxBackgroundProps> = ({ layers, offset, canvasWidth, canvasHeight, canvasRef }) => {

  const drawParallaxLayer = (context: CanvasRenderingContext2D, layer: ParallaxLayer) => {
    const { imageSrc, scale, movementRate } = layer;
    const image = new Image();
    image.src = imageSrc;

    // Wait for the image to load before drawing
    image.onload = () => {
      const x = -offset * movementRate;
      // Implement the scaling and drawing logic here
      // ...
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (context) {
      layers.forEach(layer => drawParallaxLayer(context, layer));
    }
  }, [layers, offset, canvasRef]);

  return (
    <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} />
  );
};

export default ParallaxBackground;