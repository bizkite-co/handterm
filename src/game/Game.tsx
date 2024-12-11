// TerminalGame.ts
import React, { useState, useEffect, useRef, useImperativeHandle, useCallback, useMemo } from 'react';
import { Zombie4 } from './Zombie4';
import { Hero } from './Hero';
import { Action, ActionType } from './types/ActionTypes';
import { SpritePosition } from './types/Position';
import { layers, getLevelCount } from './Level';
import { Sprite } from './sprites/Sprite';
import { IParallaxLayer, ParallaxLayer } from './ParallaxLayer';
import ScrollingTextLayer from './ScrollingTextLayer';
import confetti from 'canvas-confetti';
import { useComputed, useSignalEffect } from "@preact/signals-react";
import { commandLineSignal } from "src/signals/commandLineSignals";
import { isInGameModeSignal } from 'src/signals/gameSignals';
import { createLogger, LogLevel } from 'src/utils/Logger';

const logger = createLogger({
  prefix: 'Game',
  level: LogLevel.DEBUG
});

export interface IGameProps {
  canvasHeight: number
  canvasWidth: number
}

export interface IGameHandle {
  startGame: (tutorialGroup?: string) => void;
  completeGame: () => void;
  resetGame: () => void;
  levelUp: (setLevelValue?: number | null) => void;
}

interface ICharacterRefMethods {
  getCurrentSprite: () => Sprite | null;
  getActions: () => Record<ActionType, Action>;
  positionRef: SpritePosition;
  draw: (context: CanvasRenderingContext2D, position: SpritePosition) => number;
}

const Game: React.ForwardRefRenderFunction<IGameHandle, IGameProps> = ((props, ref) => {
  const {
    canvasHeight,
    canvasWidth,
  } = props;

  // Use useMemo to memoize static objects
  const zombie4StartPosition = useMemo(() => ({ leftX: 0, topY: 0 }), []);
  const heroStartPosition = useMemo(() => ({ leftX: 165, topY: 29 }), []);
  const heroXPercent = 0.23;

  const zombie4PositionRef = useRef<SpritePosition>(zombie4StartPosition);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<ICharacterRefMethods>(null);
  const zombie4Ref = useRef<ICharacterRefMethods>(null);
  const animationFrameIndex = useRef<number | undefined>(undefined);
  const zombie4DeathTimeout = useRef<NodeJS.Timeout | null>(null);
  const heroRunTimeoutRef = useRef<number | null>(null);

  const heroPositionRef = useRef<SpritePosition>(heroStartPosition);
  const [heroPosition, setHeroPosition] = useState<SpritePosition>({ leftX: canvasWidth * heroXPercent, topY: 30 });

  const [currentLevel, setCurrentLevel] = useState(1);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [backgroundOffsetX, setBackgroundOffsetX] = useState(0);
  const [isPhraseComplete, setIsPhraseComplete] = useState(false);
  const [isTextScrolling, setIsTextScrolling] = useState(false);
  const [heroAction, setHeroAction] = useState<ActionType>('Idle');
  const [zombie4Action, setZombie4Action] = useState<ActionType>('Walk');
  const textToScroll = "TERMINAL VELOCITY!";
  const [layersState, setLayersState] = useState<IParallaxLayer[]>(layers[0]);

  const commandLine = useComputed(() => commandLineSignal.value);
  const isInGameMode = useComputed(() => isInGameModeSignal.value).value;

  // Memoize getLevel to prevent unnecessary re-renders
  const getLevel = useCallback(() => currentLevel, [currentLevel]);

  const stopAnimationLoop = useCallback(() => {
    if (animationFrameIndex.current) {
      cancelAnimationFrame(animationFrameIndex.current);
      animationFrameIndex.current = undefined;
    }
  }, []);

  const triggerConfettiCannon = useCallback(() => {
    confetti({
      zIndex: 3,
      angle: 160,
      spread: 45,
      startVelocity: 45,
      particleCount: 150,
      origin: { x: 0.99, y: 0.8 }
    });
  }, []);

  const setZombie4ToDeathThenResetPosition = useCallback(() => {
    if (zombie4DeathTimeout.current) {
      clearTimeout(zombie4DeathTimeout.current);
      zombie4DeathTimeout.current = null;
    }

    setZombie4Action('Death');
    zombie4DeathTimeout.current = setTimeout(() => {
      setZombie4Action('Walk');
      zombie4PositionRef.current = zombie4StartPosition;
      setIsPhraseComplete(false);
      zombie4DeathTimeout.current = null;
    }, 3000);
  }, [zombie4StartPosition]);

  const updateCharacterAndBackgroundPostion = useCallback((_context: CanvasRenderingContext2D): number => {
    const canvasCenterX = canvasWidth * heroXPercent;
    const characterReachThreshold = canvasCenterX;

    _context.clearRect(0, 0, canvasWidth, canvasHeight);

    let heroDx = 0;
    if (heroRef.current && _context) {
      heroDx = heroRef.current.draw(_context, heroPosition);
    }

    if (zombie4Ref.current && _context) {
      const zombie4Dx = zombie4Ref.current.draw(_context, zombie4PositionRef.current);
      zombie4PositionRef.current = {
        ...zombie4PositionRef.current,
        leftX: zombie4PositionRef.current.leftX + zombie4Dx - heroDx
      };
    }

    if (heroDx !== 0) {
      setBackgroundOffsetX(prev => prev + heroDx);

      if (heroPosition.leftX >= characterReachThreshold) {
        setHeroPosition(prev => ({ ...prev, leftX: characterReachThreshold }));
      }

      const newZombie4PositionX = zombie4PositionRef.current.leftX - heroDx;
      zombie4PositionRef.current = {
        ...zombie4PositionRef.current,
        leftX: newZombie4PositionX
      };
    }
    return heroDx;
  }, [canvasWidth, canvasHeight, heroPosition]);

  const checkProximityAndSetAction = useCallback(() => {
    const ATTACK_THRESHOLD = 100;
    const distance = heroPosition.leftX - zombie4PositionRef.current.leftX;
    console.log("Distance:", Math.round(distance / 5) * 5, heroAction, zombie4Action);

    if (-20 < distance && distance < ATTACK_THRESHOLD) {
      setZombie4Action('Attack');
      if (distance < 50) {
        setHeroAction('Hurt');
      }
      if (distance < 30) {
        setHeroAction('Death');
      }
    } else {
      if (zombie4Action === 'Attack') {
        setZombie4Action('Walk');
      }
    }
  }, [heroPosition, zombie4Action]);

  const toggleScrollingText = useCallback((show: boolean | null = null) => {
    if (show === null) show = !isTextScrolling;
    setIsTextScrolling(show);
  }, [isTextScrolling]);

  const drawScrollingText = useCallback(() => {
    toggleScrollingText(true);
    setTimeout(() => {
      toggleScrollingText(false);
    }, 3000);
  }, [toggleScrollingText]);

  const startAnimationLoop = useCallback((context: CanvasRenderingContext2D) => {
    const frameDelay = 150;
    let lastFrameTime = performance.now();

    const loop = () => {
      const now = performance.now();
      const deltaTime = now - lastFrameTime;

      if (deltaTime >= frameDelay) {
        lastFrameTime = now - (deltaTime % frameDelay);

        if (isPhraseComplete) {
          drawScrollingText();
        }

        updateCharacterAndBackgroundPostion(context);
        checkProximityAndSetAction();
      }
      animationFrameIndex.current = requestAnimationFrame(loop);
    };

    animationFrameIndex.current = requestAnimationFrame(loop);
  }, [isPhraseComplete, drawScrollingText]);

  const setHeroRunAction = useCallback(() => {
    if (heroRunTimeoutRef.current) {
      clearTimeout(heroRunTimeoutRef.current);
      heroRunTimeoutRef.current = null;
    }

    setHeroAction('Run');
    heroRunTimeoutRef.current = window.setTimeout(() => {
      setHeroAction('Idle');
      heroRunTimeoutRef.current = null;
    }, 800);
  }, []);

  const handleCommandLineChange = useCallback((_comandLine: string) => {
    setHeroRunAction();
  }, [setHeroRunAction]);

  useSignalEffect(() => {
    if (commandLine.value) handleCommandLineChange(commandLine.value);
  });

  const setupCanvas = useCallback((canvas: HTMLCanvasElement) => {
    const canvasContext = canvas.getContext('2d');
    if (canvasContext) {
      setContext(canvasContext);
    } else {
      logger.error("Failed to get canvas context.");
    }
  }, []);

  const setLevel = useCallback((newLevel: number) => {
    const newLayers = layers[newLevel - 1];
    setCurrentLevel(newLevel);
    setLayersState(newLayers);
  }, []);

  const levelUp = useCallback((setLevelValue: number | null = null) => {
    const levelCount = getLevelCount();
    if (setLevelValue && setLevelValue > levelCount) setLevelValue = levelCount;
    let nextLevel = setLevelValue || getLevel() + 1;
    if (nextLevel > levelCount) nextLevel = 0;
    if (nextLevel < 1) nextLevel = 1;
    setLevel(nextLevel);
  }, [setLevel, getLevel]);

  const startGame = useCallback(() => {
    if (context) {
      startAnimationLoop(context);
    }
    // Reset game state here if needed
    setIsPhraseComplete(false);
    // Add any other necessary game start logic
  }, [context, startAnimationLoop]);

  const completeGame = useCallback(() => {
    setZombie4ToDeathThenResetPosition();
    triggerConfettiCannon();
    setIsPhraseComplete(true);
  }, [setZombie4ToDeathThenResetPosition, triggerConfettiCannon]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      setupCanvas(canvas);
    }

    return () => {
      stopAnimationLoop();
      if (zombie4DeathTimeout.current) {
        clearTimeout(zombie4DeathTimeout.current);
      }
    };
  }, [setupCanvas, stopAnimationLoop]);

  useEffect(() => {
    if (context) {
      startAnimationLoop(context);
    }
  }, [context, startAnimationLoop]);

  useImperativeHandle(ref, () => ({
    startGame,
    completeGame,
    resetGame: () => {
      zombie4PositionRef.current = zombie4StartPosition;
      setIsPhraseComplete(false);
    },
    levelUp,
  }), [startGame, completeGame, levelUp, zombie4StartPosition]);

  return (
    <>
      {isInGameMode && (
        <div
          id="terminal-game"
          style={{ position: "relative", height: canvasHeight }}
        >
          <div className="parallax-background">
            {isTextScrolling && (
              <ScrollingTextLayer
                text={textToScroll}
                canvasHeight={canvasHeight}
              />
            )}
            {layersState.map((layer, index) => (
              <ParallaxLayer
                key={index}
                layer={layer}
                offset={backgroundOffsetX}
                canvasHeight={canvasHeight}
              />
            ))}
          </div>
          <canvas
            style={{ position: "absolute", top: 0, left: 0, zIndex: 2 }}
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
          />
          <Hero
            ref={heroRef}
            positionRef={heroPositionRef}
            currentActionType={heroAction}
            scale={1.95}
          />
          <Zombie4
            ref={zombie4Ref}
            positionRef={zombie4PositionRef}
            currentActionType={zombie4Action}
            scale={1.90}
          />
        </div>
      )}
    </>
  );
});

export default React.forwardRef(Game);
