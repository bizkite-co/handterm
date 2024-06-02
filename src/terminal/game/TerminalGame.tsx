import React from 'react';
import { Zombie4 } from './Zombie4';
import { Hero } from './Hero';
import { CharacterActionComponent } from './CharacterActionComponent';
import { ActionType } from './ActionTypes';

interface ITerminalGameProps {
  canvasHeight: string
  canvasWidth: string
  isInPhraseMode: boolean
}

interface ITerminalGameState {
  heroAction: ActionType;
  heroPosition: { leftX: number; topY: number };
  zombieAction: ActionType;
  zombie4Position: { leftX: number; topY: number };
  context: CanvasRenderingContext2D | null
}

export class TerminalGame extends React.Component<ITerminalGameProps, ITerminalGameState> {
  private canvasRef = React.createRef<HTMLCanvasElement>();

  private zombie4?: Zombie4;
  private hero: Hero | null = null;
  private animationFrameIndex?: number;
  private animationCount: number = 0;
  public context: CanvasRenderingContext2D | null = null;

  private drawHero?: (context: CanvasRenderingContext2D, position: { leftX: number, topY: number }) => void;
  private drawZombie4?: (context: CanvasRenderingContext2D, position: { leftX: number, topY: number }) => void;

  constructor(props: ITerminalGameProps) {
    super(props);
    this.state = {
      heroAction: 'Run',
      heroPosition: { leftX: 75, topY: 20 },
      zombieAction: 'Walk',
      zombie4Position: { leftX: 30, topY: 0 },
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
        this.hero = new Hero(context, this.state.heroAction);
        this.zombie4 = new Zombie4(context, this.state.zombieAction);
        // No need to pass context to startAnimationLoop, as it will use the context from the state
        this.startAnimationLoop(context);
      } else {
        console.error("Obtained context is not a CanvasRenderingContext2D instance.");
      }
    } else {
      console.error("Failed to get canvas element.");
    }
  }

  startAnimationLoop(context: CanvasRenderingContext2D) {
    // console.log("startAnimationLoop", this.state.context instanceof CanvasRenderingContext2D);

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

      if (this.drawHero) {
        this.drawHero(this.state.context, this.state.heroPosition);
      }
      if (this.drawZombie4) {
        this.drawZombie4(this.state.context, this.state.zombie4Position);
      }

      this.animationCount = this.animationCount < 1000 ? this.animationCount + 1 : 0;
      // console.log("animationCount: ", this.animationCount);
      // Save the request ID to be able to cancel it
      this.animationFrameIndex = requestAnimationFrame(loop);
    };

    // Start the animation loop
    this.animationFrameIndex = requestAnimationFrame(loop);
  }

  stopAnimationLoop() {
    if (this.animationFrameIndex) {
      cancelAnimationFrame(this.animationFrameIndex);
      this.animationFrameIndex = undefined;
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
        {this.hero &&
          <CharacterActionComponent
            currentActionType={this.state.heroAction}
            baseCharacter={this.hero}
            position={this.state.heroPosition}
            onPositionChange={
              (newPosition) => this.setState({ heroPosition: newPosition })
            }
            onReady={(draw) => {
              this.drawHero = draw;
            }}
          />
        }
        {this.zombie4 &&
          <CharacterActionComponent
            currentActionType={this.state.zombieAction}
            baseCharacter={this.zombie4}
            position={this.state.zombie4Position}
            onPositionChange={
              (newPosition) => this.setState({ zombie4Position: newPosition })
            }
            onReady={(draw) => {
              this.drawZombie4 = draw;
            }}
          />
        }
      </>
    );
  }
}