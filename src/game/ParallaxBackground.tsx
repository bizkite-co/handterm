// ParallaxBackground.tsx
import React, { useEffect } from 'react';

export interface IParallaxLayer {
    imageSrc: string;
    scale: number;
    movementRate: number;
}

export interface ParallaxBackgroundProps {
    layers: IParallaxLayer[];
    offset: number; // This prop is the backgroundOffsetX from your game state
    canvasWidth: number;
    canvasHeight: number;
    canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const drawParallaxLayer = (
    context: CanvasRenderingContext2D,
    layer: IParallaxLayer,
    offset: number,
    canvasWidth: number,
    canvasHeight: number
) => {
    const { imageSrc, scale, movementRate } = layer;
    const image = new Image();
    image.src = imageSrc;

    // Wait for the image to load before drawing
    image.onload = () => {
        // Calculate the horizontal position based on the movement rate
        const x = -offset * movementRate;

        // Calculate the scaled dimensions of the image
        const scaledWidth = image.width * scale;
        const scaledHeight = image.height * scale;

        // Calculate how many times to draw the image to fill the canvas width
        const numImages = Math.ceil(canvasWidth / scaledWidth);

        // Draw the image as many times as needed to create the parallax effect
        for (let i = 0; i <= numImages; i++) {
            context.drawImage(
                image,
                x + i * scaledWidth % canvasWidth, // X position (looping the image)
                canvasHeight - scaledHeight,       // Y position (align to bottom)
                scaledWidth,                      // Scaled width
                scaledHeight                      // Scaled height
            );
        }
    };

    // If the image is already loaded (e.g., cached), draw it immediately
    if (image.complete) {
        const x = -offset * movementRate;
        const scaledWidth = image.width * scale;
        const scaledHeight = image.height * scale;
        const numImages = Math.ceil(canvasWidth / scaledWidth);
        for (let i = 0; i <= numImages; i++) {
            context.drawImage(
                image,
                x + i * scaledWidth % canvasWidth,
                canvasHeight - scaledHeight,
                scaledWidth,
                scaledHeight
            );
        }
    }
};

export const ParallaxBackground: React.FC<ParallaxBackgroundProps> = ({ layers, offset, canvasWidth, canvasHeight, canvasRef }) => {

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (context) {
            // Clear the canvas before drawing the new frame
            context.clearRect(0, 0, canvasWidth, canvasHeight);

            // Draw each layer
            layers.forEach(layer => drawParallaxLayer(context, layer, offset, canvasWidth, canvasHeight));
        }
        // console.log('ParallaxBackground rendered', layers, offset, canvasWidth, canvasHeight, canvasRef);
    }, [layers, offset, canvasWidth, canvasHeight, canvasRef]);

    // The canvas is rendered by the parent component (TerminalGame)
    return null;
};
