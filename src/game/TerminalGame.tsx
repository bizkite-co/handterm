import React, { TouchEventHandler } from 'react';
import { Zombie4 } from './Zombie4';
import { Hero } from './Hero';
import { CharacterActionFC } from './CharacterActionFC';
import { ActionType } from './types/ActionTypes';
import { SpritePosition } from './types/Position';
import { getParallaxLayers, Level } from './Level';
import { drawParallaxLayer, IParallaxLayer } from './ParallaxBackground';

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
  currentLevel: number;
  heroAction: ActionType;
  heroPosition: SpritePosition;
  heroReady: boolean;
  zombieAction: ActionType;
  zombie4Position: SpritePosition;
  zombie4Ready: boolean;
  context: CanvasRenderingContext2D | null;
  idleStartTime: number | null; // in milliseconds
  backgroundOffsetX: number;
  isPhraseComplete: boolean;
  textScrollX: number;
  layers: IParallaxLayer[];
}

export class TerminalGame extends React.Component<ITerminalGameProps, ITerminalGameState> {
  private canvasRef = React.createRef<HTMLCanvasElement>();
  private gameTime: number = 0;
  private zombie4: Zombie4 | null = null;
  private hero: Hero | null = null;
  private animationFrameIndex?: number;
  public context: CanvasRenderingContext2D | null = null;
  private heroXPercent: number = 0.3;
  isInScrollMode: boolean = true;
  zombie4DeathTimeout: NodeJS.Timeout | null = null;
  // Add a new field for the text animation
  private textScrollX: number = this.props.canvasWidth; // Start offscreen to the right
  private textToScroll: string = "Terminal Velocity!";

  getInitState(props: ITerminalGameProps): ITerminalGameState {
    return {
      currentLevel: 0,
      heroAction: props.heroAction,
      heroPosition: { leftX: props.canvasWidth * this.heroXPercent, topY: 30 },
      heroReady: false,
      zombieAction: props.zombie4Action,
      zombie4Position: { leftX: -50, topY: 0 },
      zombie4Ready: false,
      context: null as CanvasRenderingContext2D | null,
      idleStartTime: null,
      backgroundOffsetX: 0,
      isPhraseComplete: false,
      textScrollX: this.props.canvasWidth,
      layers: []
    };
  }

  public resetGame(): void {
    // TODO: Handle addListeners or subscrition before resetting state.
    // this.setState(this.getInitstate(this.props));
  }

  changeLevel = (newLevel: number) => {
    this.setState({ currentLevel: newLevel });
  }

  constructor(props: ITerminalGameProps) {
    super(props);
    this.state = this.getInitState(props);
  }

  componentDidMount() {
    console.log("Hero x: ", this.state.heroPosition, " Canvas width: ", this.props.canvasWidth);
    const canvas = this.canvasRef.current;
    this.setParallaxLayers();
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

  componentDidUpdate(
    _prevProps: Readonly<ITerminalGameProps>, 
    prevState: Readonly<ITerminalGameState>, 
    _snapshot?: any
  ): void {
    if (this.state.currentLevel !== prevState.currentLevel) {
      this.setParallaxLayers();
    }
  }

  componentWillUnmount(): void {
    if (this.animationFrameIndex) {
      cancelAnimationFrame(this.animationFrameIndex);
    }

    this.stopAnimationLoop();
    if (this.zombie4DeathTimeout) {
      clearTimeout(this.zombie4DeathTimeout);
    }
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

      } else {
        console.error("Obtained context is not a CanvasRenderingContext2D instance.");
      }
    } else {
      console.error("Failed to get canvas element.");
    }
  }

  drawScrollingText(context: CanvasRenderingContext2D) {
    context.font = 'italic 60px Arial'; // Customize as needed
    context.fillStyle = 'lightgreen'; // Text color
    context.fillText(this.textToScroll, this.textScrollX, 85); // Adjust Y coordinate as needed

    // Update the X position for the next frame
    this.textScrollX -= 5; // Adjust speed as needed

    // Reset text position if it's fully offscreen to the left
    if (this.textScrollX < -context.measureText(this.textToScroll).width) {
      this.textScrollX = this.props.canvasWidth;
    }
  }

  // Call this method when the game is completed
  public completeGame() {
    this.setZombie4ToDeathThenResetPosition();
    this.textScrollX = this.props.canvasWidth; // Reset scroll position
    this.setState({
      isPhraseComplete: true,
      textScrollX: this.props.canvasWidth
    });
  }

  public setZombie4ToDeathThenResetPosition = (): void => {
    // Set the zombie action to 'Death'
    if (this.zombie4DeathTimeout) {
      clearTimeout(this.zombie4DeathTimeout);
      this.zombie4DeathTimeout = null;
    }

    this.setZombie4Action('Death');
    // After three seconds, reset the position
    this.zombie4DeathTimeout = setTimeout(() => {
      this.setState({
        zombie4Position: { topY: 0, leftX: -70 },
        isPhraseComplete: false,
        textScrollX: this.props.canvasWidth
      });
      this.zombie4?.setCurrentPositionX(-70);
      // Optionally reset the action if needed
      this.setZombie4Action('Walk'); // Or the default action you want to set
      this.zombie4DeathTimeout = null;
    }, 5000);
  };


  // drawParallaxLayer(context: CanvasRenderingContext2D, image: HTMLImageElement, scale: number, movementRate: number) {
  //   if (image.width === 0) {
  //     console.error("image.width === 0", image.src);
  //   }

  //   const layerHeight = this.props.canvasHeight * scale;
  //   const scaledWidth = Math.max(1, image.width * scale);


  //   // Calculate how many times the image should be drawn to cover the canvas width
  //   const numImages = Math.ceil(this.props.canvasWidth / scaledWidth) + 1;


  //   // Calculate the offset for when the image scrolls
  //   const offsetX = -(this.state.backgroundOffsetX * movementRate) % scaledWidth;

  //   context.save(); // Save the current context state
  //   // context.globalAlpha = scale === 0.8 ? 0.5 : 0.6; // Adjust transparency for effect if desired

  //   // Draw the scaled image multiple times to cover the canvas width
  //   for (let i = 0; i < numImages; i++) {
  //     context.drawImage(
  //       image,
  //       0, 0, // source X, Y
  //       image.width, image.height, // source width and height
  //       offsetX + (i * scaledWidth), this.props.canvasHeight - layerHeight, // destination X, Y
  //       scaledWidth, layerHeight // destination width and height
  //     );
  //   }

  //   context.restore(); // Restore the context state
  // }
  checkProximityAndSetAction() {
    // Constants to define "near"
    // TODO: Sprite image widths seem to be off by about 150.
    const ATTACK_THRESHOLD = 250; // pixels or appropriate unit for your game

    if (!this.hero || !this.zombie4) return;

    // Calculate the distance between the hero and zombie4
    const distance = this.state.heroPosition.leftX - this.state.zombie4Position.leftX;

    // If zombie4 is near the Hero, set its current action to Attack
    if (150 < distance && distance < ATTACK_THRESHOLD) {

      // Assuming zombie4 has a method to update its action
      this.zombie4.setCurrentActionType('Attack'); // Replace 'Attack' with actual ActionType for attacking
    } else {
      // Otherwise, set it back to whatever action it should be doing when not attacking
      if (this.zombie4.getCurrentActionType() === 'Attack') {
        this.zombie4.setCurrentActionType('Walk'); // Replace 'Walk' with actual ActionType for walking
      }
    }

    // Update the state or force a re-render if necessary, depending on how your animation loop is set up
    // this.setState({ ... }); or this.forceUpdate();
  }

  setZombie4Action(action: ActionType) {
    if (!this.zombie4) return;
    this.zombie4.setCurrentActionType(action);
  }
  setParallaxLayers() {
    const layers = getParallaxLayers(this.state.currentLevel);
    this.setState({ layers });
  }
  updateCharacterAndBackground() {
    const canvasCenterX = this.props.canvasWidth * this.heroXPercent;
    const characterReachThreshold = canvasCenterX;

    if (!this.hero) return;
    const heroDx = this.hero.getCurrentAction().dx / 4;

    let newBackgroundOffsetX = this.state.backgroundOffsetX;

    // Update character position as usual
    const newHeroPositionX = canvasCenterX;

    // Check if the hero reaches the threshold
    if (newHeroPositionX >= characterReachThreshold) {
      this.isInScrollMode = true;

      // Update the background offset
      newBackgroundOffsetX += heroDx;

      this.setState({
        heroPosition: { ...this.state.heroPosition, leftX: characterReachThreshold },
        backgroundOffsetX: newBackgroundOffsetX, // Update background offset state
      });

      if (this.zombie4) this.zombie4.position.leftX -= heroDx;
    } else {
      this.setState({ heroPosition: { ...this.state.heroPosition, leftX: newHeroPositionX } });
    }
  }

  startAnimationLoop(context: CanvasRenderingContext2D) {
    const loop = (timestamp: number) => {
      if (!this.gameTime) {
        this.gameTime = timestamp; // Initialize gameTime on the first animation frame
      }

      this.gameTime = timestamp; // Update gameTime for the next frame

      context.clearRect(0, 0, context.canvas.width, context.canvas.height);

      this.updateCharacterAndBackground();
      // Get the parallax layers for the current level

      const layers = this.state.layers;
      // context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      // Draw the parallax background layers
      context.save();
      layers.forEach(layer => {
        drawParallaxLayer(context, layer, this.state.backgroundOffsetX, this.props.canvasWidth, this.props.canvasHeight);
      });
      context.restore();

      if (this.state.isPhraseComplete) {
        this.drawScrollingText(context);
      }
      // Reset globalAlpha if other drawings should not be affected
      context.globalAlpha = 1.0;

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
        <Level
          level={this.state.currentLevel}
          canvasWidth={this.props.canvasWidth}
          canvasHeight={this.props.canvasHeight}
          backgroundOffsetX={this.state.backgroundOffsetX}
          canvasRef={this.canvasRef}
        />
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

