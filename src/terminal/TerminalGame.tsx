import React from 'react';
import { Zombie4 } from './game/Zombie4';

interface ITerminalGameProps {
  canvasHeight: string
  canvasWidth: string
  isInPhraseMode: boolean
}

interface ITerminalGameState {

}

export class TerminalGame extends React.Component<ITerminalGameProps, ITerminalGameState> {
  private canvasRef = React.createRef<HTMLCanvasElement>();
  public context: CanvasRenderingContext2D | null = null;
  private zombie4?: Zombie4;
  private animationFrameId?: number;

  componentDidMount() {
    this.setupCanvas();
  }

  componentDidUpdate(prevProps: Readonly<ITerminalGameProps>): void {
    if (!prevProps.isInPhraseMode !== this.props.isInPhraseMode) {
      this.startAnimationLoop();
    }
    if (prevProps.isInPhraseMode && !this.props.isInPhraseMode) {
      this.stopAnimationLoop();
    }
  }

  setupCanvas() {
    const canvas = this.canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (!(context instanceof CanvasRenderingContext2D)) {
        console.error("Obtained context is not a CanvasRenderingContext2D instance.");
        return;
      }
      this.context = context;
      this.zombie4 = new Zombie4(this.context);
      this.startAnimationLoop();
    } else {
      console.error("Failed to get canvas element.");
    }
  }

  startAnimationLoop() {
    console.log("startAnimationLoop");

    // Use an arrow function to maintain the correct 'this' context
    const loop = (timestamp: number) => {

      if (!this.context) {
        console.error("Context is not available");
        return; // Exit the loop if the context is not available
      }

      if (!this.context.canvas) {
        console.error("Canvas is not available");
        return; // Exit the loop if the canvas is not available
      }

      if (!this.zombie4) {
        console.error("zombie4 is not available");
        return; // Exit the loop if zombie4 is not available
      }

      this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
      this.zombie4.animate(timestamp);
      this.zombie4.draw();

      // Save the request ID to be able to cancel it
      this.animationFrameId = requestAnimationFrame(loop);
    };

    // Start the animation loop
    this.animationFrameId = requestAnimationFrame(loop);
  }

  stopAnimationLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
      console.log("stopAnimationLoop");
    }
  }

  // Additional methods for calculating WPM, updating the progress bar, etc.
  render() {
    return (
      <canvas 
        // className="hidden-canvas"
        ref={this.canvasRef} 
        width={800} 
        height={this.props.canvasHeight}>

        </canvas>
    );
  }
}