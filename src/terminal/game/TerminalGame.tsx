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
  isInScrollMode: boolean = false;

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

  // In TerminalGame.tsx or where you manage the game state
  updateCharacterAndBackground() {
    const canvasCenterX = this.props.canvasWidth / 2;
    const characterReachThreshold = canvasCenterX; // Character stays in the middle

    if (!this.hero) return;
    // Get the current horizontal movement from the hero's currentAction state
    const heroDx = this.hero.getCurrentAction().dx; // Assuming this.state.heroAction.dx exists

    // Update character position as usual
    const newHeroPositionX = this.state.heroPosition.leftX + heroDx;

    // Check if the hero reaches the threshold

    if (newHeroPositionX >= characterReachThreshold) {
      this.isInScrollMode = true;
      // Stop the hero's horizontal movement at the threshold
      this.setState({ heroPosition: { ...this.state.heroPosition, leftX: characterReachThreshold } });

      // Update the background position
      this.updateBackgroundPosition(this.state.backgroundOffsetX + heroDx);
    } else {
      // Update the hero's position normally
      this.setState({ heroPosition: { ...this.state.heroPosition, leftX: newHeroPositionX } });
    }

    // Update zombie positions relative to the backgroundOffsetX
    // Assuming you have a method to update zombies
    // this.updateZombiesPosition();
  }

  drawBackground(context: CanvasRenderingContext2D) {
    context.globalAlpha = 0.6; // Set to desired transparency level (0 to 1)
    // Assuming you have a backgroundImage and a backgroundOffsetX state
    const pattern = context.createPattern(this.bgImage, 'repeat');
    if (pattern) {
      context.fillStyle = pattern;
      context.save();
      const offsetX = -this.state.backgroundOffsetX % this.bgImage.width;
      context.translate(offsetX, 0);
      // Draw the pattern twice if near the edge to cover the entire canvas plus extra space
      context.fillRect(offsetX, 0, this.props.canvasWidth - offsetX, this.props.canvasHeight);
      context.fillRect(this.bgImage.width + offsetX, 0, this.props.canvasWidth - offsetX, this.props.canvasHeight);
      context.restore();
    } else {
      // Handle the null pattern case, perhaps by filling a solid color or logging an error
      context.fillStyle = 'grey'; // Fallback color
      context.fillRect(0, 0, this.props.canvasWidth, this.props.canvasHeight);
    }
    context.globalAlpha = 1; // Set to desired transparency level (0 to 1)
  }
  updateZombiesPosition() {
    if (!this.zombie4) return;
    // Assuming you store zombies in an array and each zombie has a position
    // Adjust zombie position based on the backgroundOffsetX
    // const newZombiePosX = this.zombie4.position.leftX + this.state.backgroundOffsetX;
    // Update the zombie's position state or directly pass it to the draw method
    // this.zombie4.updatePositionAndAnimate(() => {}, this.props.canvasWidth);
  }
  startAnimationLoop(context: CanvasRenderingContext2D) {
    const loop = (timestamp: number) => {
      if (!this.gameTime) {
        this.gameTime = timestamp; // Initialize gameTime on the first animation frame
      }

      this.gameTime = timestamp; // Update gameTime for the next frame

      this.updateCharacterAndBackground();

      context.clearRect(0, 0, context.canvas.width, context.canvas.height);

      this.drawBackground(context);

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
            isInScrollMode={this.isInScrollMode}
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
            isInScrollMode={this.isInScrollMode}
          />
        }
      </>
    );
  }
}