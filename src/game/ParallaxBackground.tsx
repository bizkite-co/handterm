// ParallaxBackground.tsx
import React, { useEffect, useState } from 'react';

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
    canvasHeight: number,
    image: HTMLImageElement
) => {
    const { imageSrc, scale, movementRate } = layer;
    // const image = new Image();
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
    const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());

    useEffect(() => {
        const abortController = new AbortController(); // Create an abort controller for cleanup
        const signal = abortController.signal;

        layers.forEach(layer => {
            if (!loadedImages.has(layer.imageSrc)) {
                const image = new Image();
                image.src = layer.imageSrc;

                const onLoad = () => {
                    if (!signal.aborted) { // Only proceed if the effect has not been aborted
                        setLoadedImages(prevLoadedImages => {
                            const updatedLoadedImages = new Map(prevLoadedImages);
                            updatedLoadedImages.set(layer.imageSrc, image);
                            return updatedLoadedImages;
                        });
                    }
                };

                image.onload = onLoad;
                // Add an event listener for aborting the image loading
                signal.addEventListener('abort', () => {
                    image.onload = null; // Unset the onload handler if the effect is being cleaned up
                });
            }
        });

        // Cleanup function to abort loading if the component unmounts or layers change
        return () => {
            abortController.abort();
        };
    }, [layers]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (context) {
            // Clear the canvas before drawing the new frame

            // Draw each layer
            layers.forEach(layer => {
                const image = loadedImages.get(layer.imageSrc);
                if (image) {
                    drawParallaxLayer(context, layer, offset, canvasWidth, canvasHeight, image)
                }
            });
        }
    }, [layers, offset, canvasWidth, canvasHeight, canvasRef]);

    // The canvas is rendered by the parent component (TerminalGame)
    return null;
};
