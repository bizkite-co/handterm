import React, { TouchEventHandler } from 'react';
import { Zombie4 } from './Zombie4';
import { Hero } from './Hero';
import { CharacterActionFC } from './CharacterActionFC';
import { ActionType } from './types/ActionTypes';
import { SpritePosition } from './types/Position';

interface ITerminalGameProps {
  canvasHeight: number
  canvasWidth: number
  isInPhraseMode: boolean
  heroAction: ActionType
  zombie4Action: ActionType
  onTouchStart: TouchEventHandler<HTMLDivElement>;
  onTouchEnd: TouchEventHandler<HTMLDivElement>;
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
  private foregroundBuildings = new Image();
  private backgroundBuildings = new Image();
  private farBuildings = new Image();
  private heroXPercent: number = 0.3;

  // private lastLogTime: number = 0;
  // private nextIdleTime: number = 7000; // Next time to switch to Idle
  // private nextRunTime: number = 0; // Next time to switch back to Run

  private drawHero?: (position: SpritePosition) => void;
  private drawZombie4?: (position: SpritePosition) => void;
  isInScrollMode: boolean = true;

  constructor(props: ITerminalGameProps) {
    super(props);
    this.state = {
      heroAction: props.heroAction,
      heroPosition: { leftX: props.canvasWidth * this.heroXPercent, topY: 30 },
      heroReady: false,
      zombieAction: props.zombie4Action,
      zombie4Position: { leftX: -50, topY: 0 },
      zombie4Ready: false,
      context: null as CanvasRenderingContext2D | null,
      idleStartTime: null,
      backgroundOffsetX: 0,
    };
  }

  componentDidMount() {
    console.log("Hero x: ", this.state.heroPosition, " Canvas width: ", this.props.canvasWidth);
    this.foregroundBuildings.src = '/images/parallax-industrial-pack/parallax-industrial-pack/layers/skill-desc_0000_foreground.png' + '?t=' + new Date().getTime();
    this.backgroundBuildings.src = '/images/parallax-industrial-pack/parallax-industrial-pack/layers/skill-desc_0001_buildings.png' + '?t=' + new Date().getTime();
    this.farBuildings.src = '/images/parallax-industrial-pack/parallax-industrial-pack/layers/skill-desc_0002_far-buildings.png' + '?t=' + new Date().getTime();
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
        this.foregroundBuildings.onload = () => {


          // No need to pass context to startAnimationLoop, as it will use the context from the state
          this.startAnimationLoop(context);
        };
        this.foregroundBuildings.onerror = (e) => {
          console.error("Error loading image:", e);
        }


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
    const heroDx = this.hero.getCurrentAction().dx / 4; // Assuming this.state.heroAction.dx exists

    // Update character position as usual
    const newHeroPositionX = this.state.heroPosition.leftX + heroDx;

    // Check if the hero reaches the threshold

    if (newHeroPositionX >= characterReachThreshold) {
      this.isInScrollMode = true;
      // Stop the hero's horizontal movement at the threshold
      this.setState({ heroPosition: { ...this.state.heroPosition, leftX: characterReachThreshold } });

      // Update the background position
      this.updateBackgroundPosition(this.state.backgroundOffsetX + heroDx);
      if (this.zombie4) this.zombie4.position.leftX -= heroDx;
    } else {
      // Update the hero's position normally
      this.setState({ heroPosition: { ...this.state.heroPosition, leftX: newHeroPositionX } });
    }

    // Update zombie positions relative to the backgroundOffsetX
    // Assuming you have a method to update zombies
    // this.updateZombiesPosition();
  }

  drawBackground(context: CanvasRenderingContext2D) {

    context.globalAlpha = 1; // Set to desired transparency level (0 to 1)

    this.drawParallaxLayer(
      context,
      this.farBuildings, // the image for the background layer
      0.8, // scale for the background buildings
      0.4 // rate of movement relative to the foreground
    );
    this.drawParallaxLayer(
      context,
      this.backgroundBuildings, // the image for the background layer
      0.8, // scale for the background buildings
      0.6 // rate of movement relative to the foreground
    );

    // Draw foreground buildings on top of the background buildings
    this.drawParallaxLayer(
      context,
      this.foregroundBuildings, // the image for the foreground layer
      0.5, // scale for the foreground buildings
      1 // rate of movement (1 to move at the same rate as the scrolling offset)
    );
    context.globalAlpha = 1; // Set to desired transparency level (0 to 1)
  }

  drawParallaxLayer(context: CanvasRenderingContext2D, image: HTMLImageElement, scale: number, movementRate: number) {
    if(image.width === 0) {
      console.error("image.width === 0", image.src);
    }

    const layerHeight = this.props.canvasHeight * scale;
    const scaledWidth = Math.max(1, image.width * scale);


    // Calculate how many times the image should be drawn to cover the canvas width
    const numImages = Math.ceil(this.props.canvasWidth / scaledWidth) + 1;


    // Calculate the offset for when the image scrolls
    const offsetX = -(this.state.backgroundOffsetX * movementRate) % scaledWidth;

    context.save(); // Save the current context state
    // context.globalAlpha = scale === 0.8 ? 0.5 : 0.6; // Adjust transparency for effect if desired

    // Draw the scaled image multiple times to cover the canvas width
    for (let i = 0; i < numImages; i++) {
      context.drawImage(
        image,
        0, 0, // source X, Y
        image.width, image.height, // source width and height
        offsetX + (i * scaledWidth), this.props.canvasHeight - layerHeight, // destination X, Y
        scaledWidth, layerHeight // destination width and height
      );
    }

    context.restore(); // Restore the context state
  }
  checkProximityAndSetAction() {
    // Constants to define "near"
    const ATTACK_THRESHOLD = 100; // pixels or appropriate unit for your game

    if (!this.hero || !this.zombie4) return;

    // Calculate the distance between the hero and zombie4
    const distance = this.state.heroPosition.leftX - this.state.zombie4Position.leftX;

    // If zombie4 is near the Hero, set its current action to Attack
    if (0 < distance && distance < ATTACK_THRESHOLD) {

      // Assuming zombie4 has a method to update its action
      this.zombie4.setCurrentActionType('Attack'); // Replace 'Attack' with actual ActionType for attacking
    } else {
      // Otherwise, set it back to whatever action it should be doing when not attacking
      if(this.zombie4.getCurrentActionType() === 'Attack') {
        this.zombie4.setCurrentActionType('Walk'); // Replace 'Walk' with actual ActionType for walking
      }
    }

    // Update the state or force a re-render if necessary, depending on how your animation loop is set up
    // this.setState({ ... }); or this.forceUpdate();
  }

  setZombie4Action(action: ActionType) {
    if(!this.zombie4) return;
    this.zombie4.setCurrentActionType(action);
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
      this.checkProximityAndSetAction();
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

  handleHeroPositionChange = (newPosition: SpritePosition) => {
    this.setState({ heroPosition: newPosition });
  };
  handleZombie4PositionChange = (newPosition: SpritePosition) => {
    this.setState({ zombie4Position: newPosition });
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
          <CharacterActionFC
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
          <CharacterActionFC
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