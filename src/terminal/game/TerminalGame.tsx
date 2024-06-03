import React from 'react';
import { Zombie4 } from './Zombie4';
import { Hero } from './Hero';
import { CharacterActionComponent } from './CharacterActionComponent';
import { ActionType } from './types/ActionTypes';
import { Position } from './types/Position';

interface ITerminalGameProps {
  canvasHeight: string
  canvasWidth: string
  isInPhraseMode: boolean
  heroAction: ActionType
  zombie4Action: ActionType
}

interface ITerminalGameState {
  heroAction: ActionType;
  heroPosition: Position;
  zombieAction: ActionType;
  zombie4Position: Position;
  context: CanvasRenderingContext2D | null;
  idleStartTime: number | null; // in milliseconds
}

export class TerminalGame extends React.Component<ITerminalGameProps, ITerminalGameState> {
  private canvasRef = React.createRef<HTMLCanvasElement>();
  private gameTime: number = 0;
  private zombie4: Zombie4 | null = null;
  private hero: Hero | null = null;
  private animationFrameIndex?: number;
  private animationCount: number = 0;
  public context: CanvasRenderingContext2D | null = null;
  // private lastLogTime: number = 0;
  // private nextIdleTime: number = 7000; // Next time to switch to Idle
  // private nextRunTime: number = 0; // Next time to switch back to Run

  private drawHero?: (position: Position) => void;
  private drawZombie4?: (position: Position) => void;

  constructor(props: ITerminalGameProps) {
    super(props);
    this.state = {
      heroAction: props.heroAction,
      heroPosition: { leftX: 75, topY: 20 },
      zombieAction: props.zombie4Action,
      zombie4Position: { leftX: 30, topY: 0 },
      context: null as CanvasRenderingContext2D | null,
      idleStartTime: null,
    };
  }

  componentDidMount() {
    this.setupCanvas();
  }

  componentWillUnmount(): void {
    if (this.animationFrameIndex) {
      cancelAnimationFrame(this.animationFrameIndex);
    }

    this.stopAnimationLoop();
  }

  setupCanvas() {
    const canvas = this.canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context instanceof CanvasRenderingContext2D) {
        // Set the context in the state instead of a class property
        this.setState({ context: context });
        this.hero = new Hero(context, this.state.heroAction, this.state.heroPosition);
        this.zombie4 = new Zombie4(context, this.state.zombieAction, this.state.zombie4Position);
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
    const loop = (timestamp: number) => {

      if (!this.gameTime) {
        this.gameTime = timestamp; // Initialize gameTime on the first animation frame
      }

      // const deltaTime = timestamp - this.gameTime;
      this.gameTime = timestamp; // Update gameTime for the next frame

      // if (this.state.heroAction === 'Run' && timestamp >= this.nextIdleTime) {
      //   // Switch to Idle after 5 seconds
      //   this.setState({ heroAction: 'Idle' });
      //   console.log("heroAction", this.state.heroAction, "gameTime", this.gameTime, "timestamp", timestamp, "nextIdleTime", this.nextIdleTime);
      //   this.nextRunTime = timestamp + 2000; // Set the next time to switch back to Run
      // } else if (this.state.heroAction === 'Idle' && timestamp >= this.nextRunTime) {
      //   // Switch back to Run after 2 seconds of being Idle
      //   this.setState({ heroAction: 'Run' });
      //   console.log("heroAction", this.state.heroAction, "gameTime", this.gameTime, "timestamp", timestamp, "nextIdleTime", this.nextIdleTime);
      //   this.nextIdleTime = timestamp + 5000; // Set the next time to switch to Idle
      //   this.nextRunTime = 0; // Reset nextRunTime
      // }

      this.state.context?.clearRect(0, 0, context?.canvas.width, context?.canvas.height);

      if (this.drawHero) {
        this.drawHero(this.state.heroPosition);
      }
      if (this.drawZombie4) {
        this.drawZombie4(this.state.zombie4Position);
      }

      this.animationCount = this.animationCount < 200
        ? this.animationCount + 1
        : 0;

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
    // console.log('TerminalGame render, heroAction prop:', this.props.heroAction, 'this.state.heroAction:', this.state.heroAction);
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
            name= "hero"
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
            currentActionType={this.props.zombie4Action}
            name="zombie4"
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