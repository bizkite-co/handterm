// TerminalGame.ts
import React, { TouchEventHandler } from 'react';
import { Zombie4 } from './Zombie4';
import { Hero } from './Hero';
import { Action, ActionType } from './types/ActionTypes';
import { SpritePosition } from './types/Position';
import { layers, getLevelCount } from './Level';
import { Sprite } from './sprites/Sprite';
import { IParallaxLayer, ParallaxLayer } from './ParallaxLayer';
import { TerminalCssClasses } from '../types/TerminalTypes';

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
      layers: layers[0]
    };
  }

  public getLevel = () => {
    return this.state.currentLevel;
  }
  public setLevel = (newLevel: number) => {
    const newLayers = layers[newLevel - 1];
    this.setState({
      currentLevel: newLevel,
      layers: newLayers
    });
  }

  public levelUp = (setLevel: number | null = null) => {
    let nextLevel = setLevel || this.getLevel() + 1;
    if (nextLevel > getLevelCount()) nextLevel = 1;
    if (nextLevel < 1) nextLevel = 1;
    this.setLevel(nextLevel);
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
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        this.setupCanvas(context.canvas);
      }
    }
  }


  componentDidUpdate(
    _prevProps: Readonly<ITerminalGameProps>,
    prevState: Readonly<ITerminalGameState>,
    _snapshot?: any
  ): void {
    if (this.state.currentLevel !== prevState.currentLevel) {

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


  setupCanvas(canvas: HTMLCanvasElement) {
    if (canvas) {
      const context = canvas.getContext('2d');
      if (
        context instanceof CanvasRenderingContext2D
      ) {
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


  updateCharacterAndBackgroundPostion = (_context: CanvasRenderingContext2D): number => {
    const canvasCenterX = this.props.canvasWidth * this.heroXPercent;
    const characterReachThreshold = canvasCenterX;

    // Clear the canvas for new drawing
    _context.clearRect(0, 0, this.props.canvasWidth, this.props.canvasHeight);

    let heroDx = 0;
    if (this.heroRef.current && _context) {
      // The draw method returns the dx, which we can use to update the background position
      heroDx = this.heroRef.current.draw(_context, this.state.heroPosition);
    }

    // Draw and move the zombie
    if (this.zombie4Ref.current && _context) {
      const zombie4Dx = this.zombie4Ref.current.draw(_context, this.state.zombie4Position);
      this.setState((prevState) => {
        return {
          zombie4Position: {
            ...prevState.zombie4Position, leftX: prevState.zombie4Position.leftX + zombie4Dx
          }
        };
      })
    }

    // Determine if we need to scroll the background
    if (this.isInScrollMode && heroDx !== 0) {
      // Calculate the new background offset
      // const newBackgroundOffsetX = this.state.backgroundOffsetX + heroDx;

      // Update the state with the new background offset
      this.setState((prevState) => {
        return { backgroundOffsetX: prevState.backgroundOffsetX + heroDx };
      });

      // If the hero is currently beyond the threshold, update its position to the threshold
      if (this.state.heroPosition.leftX >= characterReachThreshold) {
        this.setState({
          heroPosition: { ...this.state.heroPosition, leftX: characterReachThreshold },
        });
      }

      // Update the zombie's position based on the hero's dx value
      const newZombie4PositionX = this.state.zombie4Position.leftX - heroDx;
      this.setState({
        zombie4Position: { ...this.state.zombie4Position, leftX: newZombie4PositionX },
      });
    }
    return heroDx;
  }

  startAnimationLoop(context: CanvasRenderingContext2D) {
    const frameDelay = 150; // Delay in milliseconds (100ms for 10 FPS)
    let lastFrameTime = performance.now(); // use performance.now() for higher accuracy

    const loop = () => {
      const now = performance.now();
      const deltaTime = now - lastFrameTime;

      if (deltaTime >= frameDelay) { // Control the frame rate
        lastFrameTime = now - (deltaTime % frameDelay);

        // Get the parallax layers for the current level

        if (this.state.isPhraseComplete) {
          this.drawScrollingText(context);
        }

        this.updateCharacterAndBackgroundPostion(context);

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
    if (this.state.context && this.state.contextBackground) {
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
        <div
          id={TerminalCssClasses.TerminalGame}
          style={{ position: "relative", height: this.props.canvasHeight }}>
          <div className="parallax-background">
            {this.state.layers.map((layer, index) => (
              <ParallaxLayer
                key={index}
                layer={layer}
                offset={this.state.backgroundOffsetX}
                canvasHeight={this.props.canvasHeight}
              />
            ))}
          </div>
          <canvas
            style={{ position: "absolute", top: 0, left: 0, zIndex: 2 }}
            ref={this.canvasRef}
            width={this.props.canvasWidth}
            height={this.props.canvasHeight}>
          </canvas>
          <Hero
            ref={this.heroRef}
            currentActionType={this.props.heroActionType}
            scale={1.95}
          />
          <Zombie4
            ref={this.zombie4Ref}
            currentActionType={this.props.zombie4ActionType}
            scale={1.90}
          />
        </div>
      </>
    );
  }
}

