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
  context: CanvasRenderingContext2D | null
}

export class TerminalGame extends React.Component<ITerminalGameProps, ITerminalGameState> {
  private canvasRef = React.createRef<HTMLCanvasElement>();

  private zombie4?: Zombie4;
  private hero?: Hero;
  private animationFrameId?: number;
  private animationCount: number = 0;
  public context: CanvasRenderingContext2D | null = null;

  constructor(props: ITerminalGameProps) {
    super(props);
    this.state = {
      heroAction: 'Run',
      heroPosition: { leftX: 0, topY: 20 },
      zombieAction: 'Walk',
      zombie4Position: { leftX: -75, topY: 0 },
      context: null as CanvasRenderingContext2D | null
    };
  }

  componentDidMount() {
    this.setupCanvas();
  }

  componentDidUpdate(prevProps: Readonly<ITerminalGameProps>): void {
    if (!prevProps.isInPhraseMode !== this.props.isInPhraseMode) {
      const canvas = this.canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!(context instanceof CanvasRenderingContext2D)) {
        console.error("Obtained context is not a CanvasRenderingContext2D instance.");
        return;
      }
      this.startAnimationLoop(context);
    }
    if (prevProps.isInPhraseMode && !this.props.isInPhraseMode) {
      this.stopAnimationLoop();
    }
  }

  setupCanvas() {
    const canvas = this.canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context instanceof CanvasRenderingContext2D) {
        // Set the context in the state instead of a class property
        this.setState({ context: context });
        this.hero = new Hero(context);
        this.zombie4 = new Zombie4(context);
        // No need to pass context to startAnimationLoop, as it will use the context from the state
        this.startAnimationLoop();
      } else {
        console.error("Obtained context is not a CanvasRenderingContext2D instance.");
      }
    } else {
      console.error("Failed to get canvas element.");
    }
  }

  startAnimationLoop(context: CanvasRenderingContext2D) {
    console.log("startAnimationLoop", this.state.context instanceof CanvasRenderingContext2D);

    // Use an arrow function to maintain the correct 'this' context
    const loop = () => {

      if (!this.state.context) {
        console.error("Context is not available");
        return; // Exit the loop if the context is not available
      }

      if (!this.state.context.canvas) {
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

      // if (this.animationCount % 1000 === 0) this.setHeroIdle();

      this.state.context?.clearRect(0, 0, context?.canvas.width, context?.canvas.height);

      this.animationCount = this.animationCount < 1000 ? this.animationCount + 1 : 0;
      // console.log("animationCount: ", this.animationCount);
      // Save the request ID to be able to cancel it
      this.animationFrameId = requestAnimationFrame(loop);
    };

    // Start the animation loop
    this.animationFrameId = requestAnimationFrame(loop);
  }

  setHeroIdle() {
    this.setState({ heroAction: 'Walk' });
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
          ref={this.canvasRef}
          width={this.props.canvasWidth}
          height={this.props.canvasHeight}>
        </canvas>
        {this.state.context && (
          <CharacterActionComponent
            action={this.state.heroAction}
            position={this.state.heroPosition}
            context={this.state.context}
          />
        )}
        {this.state.context && (
          <CharacterActionComponent
            action={this.state.zombieAction}
            position={this.state.zombie4Position}
            context={this.state.context}
          />
        )}
      </>
    );
  }
}