// TerminalGame.ts
import React, { TouchEventHandler } from 'react';
import { Zombie4 } from './Zombie4';
import { Hero } from './Hero';
import { Action, ActionType } from './types/ActionTypes';
import { SpritePosition } from './types/Position';
import { getParallaxLayers, Level } from './Level';
import { drawParallaxLayer, IParallaxLayer } from './ParallaxBackground';
import { Sprite } from './sprites/Sprite';

interface ITerminalGameProps {
  canvasHeight: number
  canvasWidth: number
  isInPhraseMode: boolean
  heroActionType: ActionType
  zombie4ActionType: ActionType
  onTouchStart: TouchEventHandler<HTMLDivElement>;
  onTouchEnd: TouchEventHandler<HTMLDivElement>;
}

interface ITerminalGameState {
  currentLevel: number;
  heroActionType: ActionType;
  heroPosition: SpritePosition;
  heroReady: boolean;
  zombie4ActionType: ActionType;
  zombie4Position: SpritePosition;
  zombie4Ready: boolean;
  context: CanvasRenderingContext2D | null;
  contextBackground: CanvasRenderingContext2D | null;
  idleStartTime: number | null; // in milliseconds
  backgroundOffsetX: number;
  isPhraseComplete: boolean;
  textScrollX: number;
  layers: IParallaxLayer[];
}

interface ICharacterRefMethods {
  getCurrentSprite: () => Sprite | null;
  getActions: () => Record<ActionType, Action>;
  draw: (context: CanvasRenderingContext2D, position: SpritePosition) => number;
}

export class TerminalGame extends React.Component<ITerminalGameProps, ITerminalGameState> {

  private canvasRef = React.createRef<HTMLCanvasElement>();
  private canvasBackgroundRef = React.createRef<HTMLCanvasElement>();
  private gameTime: number = 0;
  private animationFrameIndex?: number;
  public context: CanvasRenderingContext2D | null = null;
  private heroXPercent: number = 0.23;
  isInScrollMode: boolean = true;
  zombie4DeathTimeout: NodeJS.Timeout | null = null;
  // Add a new field for the text animation
  private textScrollX: number = this.props.canvasWidth; // Start offscreen to the right
  private textToScroll: string = "Terminal Velocity!";
  private heroRef = React.createRef<ICharacterRefMethods>();
  private zombie4Ref = React.createRef<ICharacterRefMethods>();
  private image = new Image();

  getInitState(props: ITerminalGameProps): ITerminalGameState {
    return {
      currentLevel: 1,
      heroActionType: props.heroActionType,
      heroPosition: { leftX: props.canvasWidth * this.heroXPercent, topY: 30 },
      heroReady: false,
      zombie4ActionType: props.zombie4ActionType,
      zombie4Position: { leftX: 50, topY: 0 },
      zombie4Ready: false,
      context: null as CanvasRenderingContext2D | null,
      contextBackground: null as CanvasRenderingContext2D | null,
      idleStartTime: null,
      backgroundOffsetX: 0,
      isPhraseComplete: false,
      textScrollX: this.props.canvasWidth,
      layers: []
    };
  }

  public getLevel = () => {
    return this.state.currentLevel;
  }
  public setLevel = (newLevel: number) => {
    this.setState({ currentLevel: newLevel });
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
    const canvasBackground = this.canvasBackgroundRef.current;
    const canvas = this.canvasRef.current;
    this.setParallaxLayers();
    if (canvas && canvasBackground) {
      const context = canvas.getContext('2d');
      const contextBackground = canvasBackground.getContext('2d');
      if (context && contextBackground) {
        this.setupCanvas(context.canvas, contextBackground.canvas);
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
    // Ensure no animation loop is already running
    if (!this.animationFrameIndex) {
      this.startAnimationLoop(this.state.context!, this.state.contextBackground!);
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
    // console.log("backgroundOffsetX: ", this.state.backgroundOffsetX, "newOffsetX: ", newOffsetX);
  }

  setupCanvas(canvas: HTMLCanvasElement, canvasBackground: HTMLCanvasElement) {
    if (canvas && canvasBackground) {
      const context = canvas.getContext('2d');
      const contextBackground = canvasBackground.getContext('2d');
      if (
        context instanceof CanvasRenderingContext2D
        && contextBackground instanceof CanvasRenderingContext2D
      ) {
        // Set the context in the state instead of a class property
        this.setState({ context: context, contextBackground: contextBackground });

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

      // Optionally reset the action if needed
      this.setZombie4Action('Walk'); // Or the default action you want to set
      this.zombie4DeathTimeout = null;
    }, 5000);
  };


  checkProximityAndSetAction() {
    // Constants to define "near"
    // TODO: Sprite image widths seem to be off by about 150.
    const ATTACK_THRESHOLD = 250; // pixels or appropriate unit for your game

    // Calculate the distance between the hero and zombie4
    const distance = this.state.heroPosition.leftX - this.state.zombie4Position.leftX;

    // If zombie4 is near the Hero, set its current action to Attack
    if (150 < distance && distance < ATTACK_THRESHOLD) {

      // Assuming zombie4 has a method to update its action
      this.setZombie4Action('Attack'); // Replace 'Attack' with actual ActionType for attacking
    } else {
      // Otherwise, set it back to whatever action it should be doing when not attacking
      if (this.state.zombie4ActionType === 'Attack') {
        this.setZombie4Action('Walk'); // Replace 'Walk' with actual ActionType for walking
      }
    }

    // Update the state or force a re-render if necessary, depending on how your animation loop is set up
    // this.setState({ ... }); or this.forceUpdate();
  }

  setZombie4Action(action: ActionType) {
    this.setState({ zombie4ActionType: action });
  }

  setParallaxLayers() {
    const layers = getParallaxLayers(this.state.currentLevel);
    this.setState({ layers });
  }

  updateCharacterAndBackground = (_context: CanvasRenderingContext2D, heroDx: number): number => {
    const canvasCenterX = this.props.canvasWidth * this.heroXPercent;
    const characterReachThreshold = canvasCenterX;

    let heroResult = 0;

    let newBackgroundOffsetX = this.state.backgroundOffsetX ?? 0;

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

      this.updateBackgroundPosition(this.state.backgroundOffsetX + heroDx);
      const newX = this.state.zombie4Position.leftX - heroDx;
      this.setState({ zombie4Position: { ...this.state.zombie4Position, leftX: newX } });

    } else {
      this.setState({ heroPosition: { ...this.state.heroPosition, leftX: newHeroPositionX } });
    }
    _context.clearRect(0, 0, this.props.canvasWidth, this.props.canvasHeight);
    if (this.heroRef.current && _context) {
      heroResult = this.heroRef.current.draw(_context, this.state.heroPosition);
    }
    if (this.zombie4Ref.current && _context) {
      this.zombie4Ref.current.draw(_context, this.state.zombie4Position);
    }
    return heroResult;
  }

  startAnimationLoop(context: CanvasRenderingContext2D, contextBackground: CanvasRenderingContext2D) {
    const frameDelay = 150; // Delay in milliseconds (100ms for 10 FPS)
    let lastFrameTime = performance.now(); // use performance.now() for higher accuracy

    let newX = 0;

    const loop = (timestamp: number) => {
      const now = performance.now();
      const deltaTime = now - lastFrameTime;

      if (deltaTime >= frameDelay) { // Control the frame rate
        lastFrameTime = now - (deltaTime % frameDelay);

        // Get the parallax layers for the current level

        // Draw the parallax background layers
        // context.clearRect(0, 0, this.props.canvasWidth, this.props.canvasHeight);
        context.save();

        this.state.layers.forEach(layer => {
          drawParallaxLayer(contextBackground, layer, this.state.backgroundOffsetX, this.props.canvasWidth, this.props.canvasHeight, this.image);
        });

        if (this.state.isPhraseComplete) {
          this.drawScrollingText(context);
        }
        context.restore();
        // Reset globalAlpha if other drawings should not be affected
        context.globalAlpha = 1.0;

        newX = this.updateCharacterAndBackground(context, newX);
        this.setState({ backgroundOffsetX: newX });

        // Save the request ID to be able to cancel it
        // this.checkProximityAndSetAction();
      };
      this.animationFrameIndex = requestAnimationFrame(loop);

    };

    // Start the animation loop
    this.animationFrameIndex = requestAnimationFrame(loop);
  }

  // Call this method when both characters are ready to draw
  maybeStartAnimationLoop() {
    if (this.state.context && this.state.contextBackground) {
      this.startAnimationLoop(this.state.context, this.state.contextBackground);
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
        <div style={{ position: "relative" }}>
          <canvas
            style={{ position: "absolute", top: 0, left: 0, zIndex: -1 }}
            ref={this.canvasBackgroundRef}
            width={this.props.canvasWidth}
            height={this.props.canvasHeight}>
          </canvas>
          <canvas
            style={{ position: "absolute", top: 0, left: 0 }}
            ref={this.canvasRef}
            width={this.props.canvasWidth}
            height={this.props.canvasHeight}>
          </canvas>
        </div>
        <Level
          level={this.state.currentLevel}
          canvasWidth={this.props.canvasWidth}
          canvasHeight={this.props.canvasHeight}
          backgroundOffsetX={this.state.backgroundOffsetX}
          canvasRef={this.canvasRef}
        />
        <Hero
          ref={this.heroRef}
          currentActionType={this.props.heroActionType}
          scale={2}
        />
        <Zombie4
          ref={this.zombie4Ref}
          currentActionType={this.props.zombie4ActionType}
          scale={2}
        />
      </>
    );
  }
}

