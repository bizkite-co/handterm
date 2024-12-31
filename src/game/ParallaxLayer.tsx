import type React from "react";

export interface IParallaxLayer {
  imageSrc: string;
  scale: number; // This is a multiplier (e.g., 0.8 for 80%)
  movementRate: number;
}

export const ParallaxLayer: React.FC<{ layer: IParallaxLayer; offset: number; canvasHeight: number }> = ({ layer, offset, canvasHeight }) => {
  // Calculate the height of the background as a percentage of the canvas height
  const backgroundHeight = canvasHeight * layer.scale; // Now scale is a direct multiplier
  const top = canvasHeight - (canvasHeight * layer.scale)
  const layerStyle: React.CSSProperties = {
    backgroundImage: `url(${layer.imageSrc})`,
    backgroundPositionX: -offset * layer.movementRate,
    backgroundRepeat: 'repeat-x',
    backgroundSize: `auto ${backgroundHeight}px`, // Use pixel value for height to match the canvasHeight scaling
    willChange: 'transform',
    height: `${backgroundHeight}px`, // Use pixel value for the height
    width: '100%',
    position: 'absolute',
    top: top, // Align to the top of the container
  };

  return <div className="parallax-layer" style={layerStyle} />;
};