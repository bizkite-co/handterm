import { FramePostion } from "../types/Position";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export class Sprite {
    public image: HTMLImageElement;
    public frameCount: number;
    private frameWidth: number;
    private frameHeight: number;
    private frameSequence?: FramePostion[];

    constructor(
        imagePath: string,
        frameCount: number,
        frameWidth?: number,
        frameHeight?: number,
        frameSequence?: FramePostion[]
    ) {
        this.image = new Image();
        this.image.onload = () => {
            assert(this.image.complete, 'Image failed to load: ' + imagePath);
            if (!this.frameWidth) {
                this.frameWidth = this.image.width / this.frameCount;
            }
            if (!this.frameHeight) {
                this.frameHeight = this.image.height;
            }
        };
        this.image.onerror = () => {
            // Log error without using console.error
            const errorMessage = 'Image failed to load: ' + imagePath;
            if (typeof window !== 'undefined' && window.console && window.console.error) {
                window.console.error(errorMessage);
            }
        }
        this.image.src = imagePath;
        this.frameCount = frameCount;
        this.frameWidth = frameWidth || 0; // Set when the image loads if not provided
        this.frameHeight = frameHeight || 0; // Set when the image loads if not provided
        this.frameSequence = frameSequence;
    }

    public updateFrameIndex(currentFrameIndex: number, timestamp: number, lastFrameTime: number, frameDelay: number): number {
        // Calculate if enough time has passed since the last frame update
        if (timestamp - lastFrameTime > frameDelay) {
            // Increment frameIndex and loop back to 0 if it exceeds frameCount
            return (currentFrameIndex + 1) % this.frameCount;
        } else {
            // Return the last frame index if not enough time has passed
            return currentFrameIndex;
        }
    }

    public draw = (
        context: CanvasRenderingContext2D,
        frameIndex: number,
        leftX: number,
        topY: number,
        scale: number = 1.5
    ) => {
        let frameLeftX = 0, frameTopY = 0;
        if (this.frameSequence) {
            // Use the frame sequence if provided
            const frameCoords = this.frameSequence[frameIndex];
            if(frameCoords){
                frameLeftX = frameCoords.leftX;
                frameTopY = frameCoords.topY;
            } else {
                // Log error without using console.error
                const errorMessage = `No frameCoords found for frameIndex: ${frameIndex}`;
                if (typeof window !== 'undefined' && window.console && window.console.error) {
                    window.console.error(errorMessage);
                }
            }
        } else {
            // Calculate frame position for strip-style sprites
            frameLeftX = this.frameWidth * frameIndex;
            frameTopY = 0;
        }
        context.drawImage(
            this.image,
            frameLeftX, frameTopY, // source x, y
            this.frameWidth, this.frameHeight, // source width, height
            leftX, topY, // destination x, y
            this.frameWidth * scale, this.frameHeight * scale // destination width, height (scaled)
        );
    }

    // ... rest of the Sprite class methods
}
