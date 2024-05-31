import React from 'react';
import { Zombie4 } from './Zombie4';
import { Hero } from './Hero';
import { CharacterActionComponent } from './CharacterActionComponent';

interface ITerminalGameProps {
  canvasHeight: string
  canvasWidth: string
  isInPhraseMode: boolean
}

interface ITerminalGameState {
  heroAction: 'Run' | 'Walk' | 'Idle' | 'Attack' | 'Hurt' | 'Death';
  heroPosition: { leftX: 0; topY: 20 };
  zombieAction: 'Walk' | 'Hurt' | 'Death' | 'Idle' | 'Attack';
  zombie4Position: { leftX: -75; topY: 0 };
}

export class TerminalGame extends React.Component<ITerminalGameProps, ITerminalGameState> {
  private canvasRef = React.createRef<HTMLCanvasElement>();
  public context: CanvasRenderingContext2D | null = null;
  private zombie4?: Zombie4;
  private hero?: Hero;
  private animationFrameId?: number;

  constructor(props: ITerminalGameProps) {
    super(props);
    this.state = {
      heroAction: 'Run',
      heroPosition: { leftX: 0, topY: 20 },
      zombieAction: 'Walk',
      zombie4Position: { leftX: -75, topY: 0 },
    };
  }

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
      this.hero = new Hero(this.context);
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
      if (!this.hero) {
        console.error("hero is not available");
        return; // Exit the loop if hero is not available
      }

      this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
      this.hero.animate(timestamp);
      this.hero.draw();
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
      <>
        <canvas
          // className="hidden-canvas"
          ref={this.canvasRef}
          width={1000}
          height={this.props.canvasHeight}>

        </canvas>
        <CharacterActionComponent
          initialAction={this.state.heroAction}
          position={this.state.heroPosition}
        // ...otherProps
        />
        <CharacterActionComponent
          initialAction={this.state.zombieAction}
          position={this.state.zombie4Position}
        // ...otherProps
        />
      </>
    );
  }
}