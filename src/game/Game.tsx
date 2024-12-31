// TerminalGame.ts
import { useState, useEffect, useRef, useImperativeHandle, useCallback, useMemo, forwardRef } from 'react';

import confetti from 'canvas-confetti';

import { useComputed, useSignalEffect } from "@preact/signals-react";

import { commandLineSignal } from "../signals/commandLineSignals";
import { isInGameModeSignal } from '../signals/gameSignals';
import { createLogger, LogLevel } from '../utils/Logger';

import { Hero } from './Hero';
import { layers, getLevelCount } from './Level';
import { type IParallaxLayer, ParallaxLayer } from './ParallaxLayer';
import ScrollingTextLayer from './ScrollingTextLayer';
import { type Sprite } from './sprites/Sprite';
import { type Action, type ActionType } from './types/ActionTypes';
import { type SpritePosition } from './types/Position';
import { Zombie4 } from './Zombie4';

const logger = createLogger({
  prefix: 'Game',
  level: LogLevel.DEBUG
});

interface ICharacterRefMethods {
  getCurrentSprite: () => Sprite | null;
  getActions: () => Record<ActionType, Action>;
  positionRef: SpritePosition;
  draw: (context: CanvasRenderingContext2D, position: SpritePosition) => number;
}

interface IGameProps {
  canvasHeight: number;
  canvasWidth: number;
}

interface IGameHandle {
  startGame: (tutorialGroup?: string) => void;
  completeGame: () => void;
  resetGame: () => void;
  levelUp: (setLevelValue?: number | null) => void;
}

function GameFunction(props: IGameProps, ref: React.ForwardedRef<IGameHandle>): JSX.Element {
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
  const [layersState, setLayersState] = useState<IParallaxLayer[]>(layers[0] ?? []);

  const commandLine = useComputed(() => commandLineSignal.value);
  const isInGameMode = useComputed(() => isInGameModeSignal.value).value;

  // Memoize getLevel to prevent unnecessary re-renders
  const getLevel = useCallback(() => currentLevel, [currentLevel]);

  const stopAnimationLoop = useCallback(() => {
    const frameId = animationFrameIndex.current;
    if (typeof frameId === 'number' && !Number.isNaN(frameId)) {
      cancelAnimationFrame(frameId);
      animationFrameIndex.current = undefined;
    }
  }, []);

  const triggerConfettiCannon = useCallback(() => {
    void confetti({
      zIndex: 3,
      angle: 160,
      spread: 45,
      startVelocity: 45,
      particleCount: 150,
      origin: { x: 0.99, y: 0.8 }
    });
  }, []);

  const setZombie4ToDeathThenResetPosition = useCallback(() => {
    const timeout = zombie4DeathTimeout.current;
    if (timeout !== null) {
      clearTimeout(timeout);
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

  const updateCharacterAndBackgroundPostion = useCallback((context: CanvasRenderingContext2D): number => {
    const canvasCenterX = canvasWidth * heroXPercent;
    const characterReachThreshold = canvasCenterX;

    context.clearRect(0, 0, canvasWidth, canvasHeight);

    let heroDx = 0;
    const hero = heroRef.current;
    if (hero !== null) {
      heroDx = hero.draw(context, heroPosition);
    }

    const zombie = zombie4Ref.current;
    if (zombie !== null) {
      const zombie4Dx = zombie.draw(context, zombie4PositionRef.current);
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
  }, [heroPosition, zombie4Action, setHeroAction]);

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

      if (typeof deltaTime === 'number' && !Number.isNaN(deltaTime) && deltaTime >= frameDelay) {
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
  }, [isPhraseComplete, drawScrollingText, updateCharacterAndBackgroundPostion, checkProximityAndSetAction]);

  const setHeroRunAction = useCallback(() => {
    const timeout = heroRunTimeoutRef.current;
    if (timeout !== null) {
      clearTimeout(timeout);
      heroRunTimeoutRef.current = null;
    }

    setHeroAction('Run');
    heroRunTimeoutRef.current = window.setTimeout(() => {
      setHeroAction('Idle');
      heroRunTimeoutRef.current = null;
    }, 800);
  }, [setHeroAction]);

  const handleCommandLineChange = useCallback(() => {
    setHeroRunAction();
  }, [setHeroRunAction]);

  useSignalEffect(() => {
    if (commandLine.value?.trim() !== '') {
      handleCommandLineChange();
    }
  });

  const setupCanvas = useCallback((canvas: HTMLCanvasElement) => {
    const canvasContext = canvas.getContext('2d');
    if (canvasContext !== null) {
      setContext(canvasContext);
    } else {
      logger.error("Failed to get canvas context.");
    }
  }, []);

  const setLevel = useCallback((newLevel: number) => {
    const levelIndex = Math.max(0, Math.min(newLevel - 1, layers.length - 1));
    const newLayers = layers[levelIndex] ?? [];
    setCurrentLevel(newLevel);
    setLayersState(newLayers);
  }, []);

  const levelUp = useCallback((setLevelValue: number | null = null) => {
    const levelCount = getLevelCount();
    if (setLevelValue !== null && setLevelValue > levelCount) {
      setLevelValue = levelCount;
    }
    let nextLevel = setLevelValue !== null ? setLevelValue : getLevel() + 1;
    if (nextLevel > levelCount) nextLevel = 0;
    if (nextLevel < 1) nextLevel = 1;
    setLevel(nextLevel);
  }, [setLevel, getLevel]);

  const startGame = useCallback(() => {
    if (context !== null) {
      startAnimationLoop(context);
    }
    setIsPhraseComplete(false);
  }, [context, startAnimationLoop]);

  const completeGame = useCallback(() => {
    setZombie4ToDeathThenResetPosition();
    triggerConfettiCannon();
    setIsPhraseComplete(true);
  }, [setZombie4ToDeathThenResetPosition, triggerConfettiCannon]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas !== null) {
      setupCanvas(canvas);
    }

    return () => {
      stopAnimationLoop();
      const timeout = zombie4DeathTimeout.current;
      if (timeout !== null) {
        clearTimeout(timeout);
      }
    };
  }, [setupCanvas, stopAnimationLoop]);

  useEffect(() => {
    if (context !== null) {
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

  if (!isInGameMode) {
    return <div />;
  }

  return (
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
        data-testid="game-canvas"
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
  );
}

export type { IGameHandle, IGameProps };
export const Game = forwardRef(GameFunction);
