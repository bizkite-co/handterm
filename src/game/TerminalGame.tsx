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
  zombie4Action: ActionType;
  zombie4Position: SpritePosition;
  zombie4Ready: boolean;
  context: CanvasRenderingContext2D | null;
  idleStartTime: number | null; // in milliseconds
  backgroundOffsetX: number;
  isPhraseComplete: boolean;
  textScrollX: number;
  layers: IParallaxLayer[];
}

interface CharacterRefMethods {
  getCurrentSprite: () => Sprite | null;
  getActions: () => Record<ActionType, Action>;
  draw: (context: CanvasRenderingContext2D, position: SpritePosition) => {
    position: SpritePosition;
  };
}

export class TerminalGame extends React.Component<ITerminalGameProps, ITerminalGameState> {

  private canvasRef = React.createRef<HTMLCanvasElement>();
  private gameTime: number = 0;
  private animationFrameIndex?: number;
  public context: CanvasRenderingContext2D | null = null;
  private heroXPercent: number = 0.23;
  isInScrollMode: boolean = true;
  zombie4DeathTimeout: NodeJS.Timeout | null = null;
  // Add a new field for the text animation
  private textScrollX: number = this.props.canvasWidth; // Start offscreen to the right
  private textToScroll: string = "Terminal Velocity!";
  private heroRef = React.createRef<CharacterRefMethods>();
  private zombie4Ref = React.createRef<CharacterRefMethods>();
  private image = new Image();

  getInitState(props: ITerminalGameProps): ITerminalGameState {
    return {
      currentLevel: 1,
      heroAction: props.heroAction,
      heroPosition: { leftX: props.canvasWidth * this.heroXPercent, topY: 30 },
      heroReady: false,
      zombie4Action: props.zombie4Action,
      zombie4Position: { leftX: 50, topY: 0 },
      zombie4Ready: false,
      context: null as CanvasRenderingContext2D | null,
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
    const canvas = this.canvasRef.current;
    this.setParallaxLayers();
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
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
    // Ensure no animation loop is already running
    if (!this.animationFrameIndex) {
      this.startAnimationLoop(this.state.context!);
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
      if (this.state.zombie4Action === 'Attack') {
        this.setZombie4Action('Walk'); // Replace 'Walk' with actual ActionType for walking
      }
    }

    // Update the state or force a re-render if necessary, depending on how your animation loop is set up
    // this.setState({ ... }); or this.forceUpdate();
  }

  setZombie4Action(action: ActionType) {
    this.setState({ zombie4Action: action });
  }

  setParallaxLayers() {
    const layers = getParallaxLayers(this.state.currentLevel);
    this.setState({ layers });
  }

  updateCharacterAndBackground(_context: CanvasRenderingContext2D) {
    const canvasCenterX = this.props.canvasWidth * this.heroXPercent;
    const characterReachThreshold = canvasCenterX;

    let heroResult = {};
    // const heroDx
    //   = this.heroActions
    //     ? this.heroActions[this.state.heroAction].dx / 4
    //     : 0;

    let newBackgroundOffsetX = this.state.backgroundOffsetX;

    // Update character position as usual
    const newHeroPositionX = canvasCenterX;

    // Check if the hero reaches the threshold
    if (newHeroPositionX >= characterReachThreshold) {
      this.isInScrollMode = true;

      // Update the background offset
      // newBackgroundOffsetX += heroDx;

      this.setState({
        heroPosition: { ...this.state.heroPosition, leftX: characterReachThreshold },
        backgroundOffsetX: newBackgroundOffsetX, // Update background offset state
      });

      // this.updateBackgroundPosition(this.state.backgroundOffsetX + heroDx);
      // if (this.zombie4Actions) {
      //   const newX = this.state.zombie4Position.leftX - heroDx;
      //   this.setState({ zombie4Position: { ...this.state.zombie4Position, leftX: newX } });
      // }

    } else {
      this.setState({ heroPosition: { ...this.state.heroPosition, leftX: newHeroPositionX } });
    }
    if (this.heroRef.current && _context) {
      heroResult = this.heroRef.current.draw(_context, this.state.heroPosition);
    }
    if (this.zombie4Ref.current && _context) {
      this.zombie4Ref.current.draw(_context, this.state.zombie4Position);
    }
    return heroResult;
  }

  startAnimationLoop(context: CanvasRenderingContext2D) {
    const frameDelay = 150; // Delay in milliseconds (100ms for 10 FPS)
    let lastFrameTime = 0; // Time at which the last frame was processed
    let newX = 0;

    const loop = (timestamp: number) => {
      if (!this.gameTime) {
        this.gameTime = timestamp; // Initialize gameTime on the first animation frame
        lastFrameTime = timestamp; // Initialize lastFrameTime on the first frame
      }

      // Calculate the time elapsed since the last frame
      const timeElapsed = timestamp - lastFrameTime;

      if (timeElapsed >= frameDelay) {
        // Update lastFrameTime to the current timestamp
        lastFrameTime = timestamp - (timeElapsed % frameDelay);

        // Get the parallax layers for the current level

        // Draw the parallax background layers
        // context.clearRect(0, 0, this.props.canvasWidth, this.props.canvasHeight);
        context.save();
        
        this.state.layers.forEach(layer => {
          drawParallaxLayer(context, layer, this.state.backgroundOffsetX, this.props.canvasWidth, this.props.canvasHeight, this.image);
        });

        if (this.state.isPhraseComplete) {
          this.drawScrollingText(context);
        }
        // Reset globalAlpha if other drawings should not be affected
        context.globalAlpha = 1.0;

        newX = this.updateCharacterAndBackground(context);
        this.setState({ backgroundOffsetX: newX });
        context.restore();

        // Save the request ID to be able to cancel it
        this.checkProximityAndSetAction();
        };
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
        <Hero
          ref={this.heroRef}
          currentActionType='Idle'
          scale={2}
        />
        <Zombie4
          ref={this.zombie4Ref}
          currentActionType='Walk'
          scale={2}
        />
      </>
    );
  }
}

