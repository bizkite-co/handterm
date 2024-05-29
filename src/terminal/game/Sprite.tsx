export class Sprite {
  private image: HTMLImageElement;
  private frameCount: number;
  private frameWidth: number;
  private frameHeight: number;

  constructor(imagePath: string, frameCount: number) {
    this.image = new Image();
    this.image.src = imagePath;
    this.frameCount = frameCount;
    this.frameWidth = 0; // To be set when the image loads
    this.frameHeight = 0; // To be set when the image loads

    this.image.onload = () => {
      this.frameWidth = this.image.width / this.frameCount;
      this.frameHeight = this.image.height;
    };
  }

  public updateFrameIndex(timestamp: number, lastFrameTime: number, frameDelay: number): number {
    // Calculate if enough time has passed since the last frame update
    if (timestamp - lastFrameTime > frameDelay) {
      // Increment frameIndex and loop back to 0 if it exceeds frameCount
      return (lastFrameTime + 1) % this.frameCount;
    } else {
      // Return the last frame index if not enough time has passed
      return lastFrameTime;
    }
  }

  public draw(context: CanvasRenderingContext2D, frameIndex: number, x: number, y: number, scale: number = 1) {
    const frameX = this.frameWidth * frameIndex;

    context.drawImage(
      this.image,
      frameX, 0, // source x, y
      this.frameWidth, this.frameHeight, // source width, height
      x, y, // destination x, y
      this.frameWidth * scale, this.frameHeight * scale // destination width, height (scaled)
    );
  }

  // Additional methods for handling animations, scaling, and other transformations can be added here.
}