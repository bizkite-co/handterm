import React from 'react';
import { Zombie4 } from './Zombie4';
import { Hero } from './Hero';
import { CharacterActionComponent } from './CharacterActionComponent';
import { ActionType } from './types/ActionTypes';
import { SpritePosition } from './types/Position';

interface ITerminalGameProps {
  canvasHeight: number
  canvasWidth: number
  isInPhraseMode: boolean
  heroAction: ActionType
  zombie4Action: ActionType
}

interface ITerminalGameState {
  heroAction: ActionType;
  heroPosition: SpritePosition;
  heroReady: boolean;
  zombieAction: ActionType;
  zombie4Position: SpritePosition;
  zombie4Ready: boolean;
  context: CanvasRenderingContext2D | null;
  idleStartTime: number | null; // in milliseconds
  backgroundOffsetX: number;
}

export class TerminalGame extends React.Component<ITerminalGameProps, ITerminalGameState> {
  private canvasRef = React.createRef<HTMLCanvasElement>();
  private gameTime: number = 0;
  private zombie4: Zombie4 | null = null;
  private hero: Hero | null = null;
  private animationFrameIndex?: number;
  public context: CanvasRenderingContext2D | null = null;
  private bgImage = new Image();
  // private lastLogTime: number = 0;
  // private nextIdleTime: number = 7000; // Next time to switch to Idle
  // private nextRunTime: number = 0; // Next time to switch back to Run

  private drawHero?: (position: SpritePosition) => void;
  private drawZombie4?: (position: SpritePosition) => void;

  constructor(props: ITerminalGameProps) {
    super(props);
    this.state = {
      heroAction: props.heroAction,
      heroPosition: { leftX: 175, topY: 30 },
      heroReady: false,
      zombieAction: props.zombie4Action,
      zombie4Position: { leftX: -70, topY: 0 },
      zombie4Ready: false,
      context: null as CanvasRenderingContext2D | null,
      idleStartTime: null,
      backgroundOffsetX: 0,

    };
  }

  componentDidMount() {
    const canvas = this.canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
          this.hero = new Hero(
            context, this.state.heroAction, this.state.heroPosition
          );
          this.zombie4 = new Zombie4(
            context, this.state.zombieAction, this.state.zombie4Position
          );
        this.setupCanvas();
      }
    }
  }

  componentWillUnmount(): void {
    if (this.animationFrameIndex) {
      cancelAnimationFrame(this.animationFrameIndex);
    }

    this.stopAnimationLoop();
  }

  // Call this method to update the background position
  updateBackgroundPosition(newOffsetX: number) {
    this.setState({ backgroundOffsetX: newOffsetX });
  }

  setupCanvas() {
    const canvas = this.canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context instanceof CanvasRenderingContext2D) {
        // Set the context in the state instead of a class property
        this.setState({ context: context });

        // Load background images
        this.bgImage.onload = () => {


          // No need to pass context to startAnimationLoop, as it will use the context from the state
          this.startAnimationLoop(context);
        };
        this.bgImage.onerror = (e) => {
          console.error("Error loading image:", e);
        }

        this.bgImage.src = '/images/parallax-industrial-pack/parallax-industrial-pack/layers/skill-desc_0000_foreground.png' + '?t=' + new Date().getTime();

      } else {
        console.error("Obtained context is not a CanvasRenderingContext2D instance.");
      }
    } else {
      console.error("Failed to get canvas element.");
    }
  }

  startAnimationLoop(context: CanvasRenderingContext2D) {
    const loop = (timestamp: number) => {
      if (!this.gameTime) {
        this.gameTime = timestamp; // Initialize gameTime on the first animation frame
      }

      this.gameTime = timestamp; // Update gameTime for the next frame

      context.clearRect(0, 0, context.canvas.width, context.canvas.height);

      context.globalAlpha = 0.6; // Set to desired transparency level (0 to 1)
      const pattern = context.createPattern(this.bgImage, 'repeat');
      if (pattern) {
        context.fillStyle = pattern;
        // Fill the entire canvas with the pattern
        context.fillRect(
          0,
          0,
          context.canvas.width,
          context.canvas.height * 0.9
        );
      }

      // Reset globalAlpha if other drawings should not be affected
      context.globalAlpha = 1.0;

      if (this.drawHero) {
        this.drawHero(this.state.heroPosition);
      }
      if (this.drawZombie4) {
        this.drawZombie4(this.state.zombie4Position);
      }

      // Save the request ID to be able to cancel it
      this.animationFrameIndex = requestAnimationFrame(loop);
    };

    // Start the animation loop
    this.animationFrameIndex = requestAnimationFrame(loop);
  }
  // Call this method when both characters are ready to draw
  maybeStartAnimationLoop() {
    if (this.state.context && this.state.heroReady && this.state.zombie4Ready) {
      this.startAnimationLoop(this.state.context);
    }
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
            currentActionType={this.props.heroAction}
            name="hero"
            canvasWidth={this.props.canvasWidth}
            baseCharacter={this.hero}
            position={this.state.heroPosition}
            onPositionChange={
              (newPosition) => this.setState({ heroPosition: newPosition })
            }
          />
        }
        {this.zombie4 &&
          <CharacterActionComponent
            currentActionType={this.props.zombie4Action}
            name="zombie4"
            canvasWidth={this.props.canvasWidth}
            baseCharacter={this.zombie4}
            position={this.state.zombie4Position}
            onPositionChange={
              (newPosition) => this.setState({ zombie4Position: newPosition })
            }
          />
        }
      </>
    );
  }
}