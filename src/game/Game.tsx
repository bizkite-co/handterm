// TerminalGame.ts
import { useState, useEffect, useRef, useImperativeHandle, useCallback, useMemo, forwardRef, type ForwardedRef, type JSX } from 'react';

import confetti from 'canvas-confetti';

import { useComputed, useSignalEffect } from "@preact/signals-react";

import { commandLineSignal } from "../signals/commandLineSignals";
import { isInGameModeSignal, gamePhraseSignal, gameLevelSignal, setGameLevel } from '../signals/gameSignals';
import { createLogger, LogLevel } from '../utils/Logger';
import { isNotNullOrUndefined } from '../utils/typeSafetyUtils';

import { Hero } from './Hero';
import { layers, getLevelCount } from './Level';
import { type IParallaxLayer, ParallaxLayer } from './ParallaxLayer';
import ScrollingTextLayer from './ScrollingTextLayer';
import { type Sprite } from './sprites/Sprite';
import { type Action, type ActionType } from './types/ActionTypes';
import { type SpritePosition, type CharacterHitbox } from './types/Position';
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
  hitbox: CharacterHitbox;
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

// Game tuning. Everything is centered here so numbers can be tweaked without
// hunting through the logic. Canvas coordinates are device PIXELS: `leftX` is
// the sprite's x position in px from the left edge (negative = off-screen left).
// The hero/zombie hitboxes are body footprints relative to each character's
// LOGICAL leftX (the zombie's includes its 41 xOffset).
const GAME_TUNING = {
  // Initial placement (px from the left edge of the canvas).
  heroStartLeftX: 30,      // hero anchors near the left edge; runs right to center
  zombieStartLeftX: -130,  // zombie spawns just OFF the left edge and walks on (lull)

  // Run / world scroll.
  heroRunStepPx: 30,       // px the hero advances per run keystroke toward center
                           // once centered, that advance instead scrolls the world

  // Contact / combat.
  fightGap: 2,             // body-gap (px) at which the zombie is close enough to fight
  hitIntervalMs: 2200,     // zombie swipe tempo (matches the 15-frame Attack anim)
  maxHeroLives: 3,         // hits to kill the hero (then restart this level)
  fightSwingMs: 800,       // how long a player-initiated swing / run flash lasts

  // Defensive typing.
  zombiePushBackPx: 5,     // ONLY when the player swings: px the zombie retreats
  zombieFloorLeftX: -130,  // retreat floor — zombie never goes far off the left edge

  // Body footprints (relative to logical leftX).
  heroHitbox: { left: 29, width: 43 },    // body x[15..36] of 50px frame @1.95
  zombieHitbox: { left: 83, width: 36 },  // body x[22..40] of 62px frame, incl. the 41 xOffset
} as const;

function GameFunction(props: IGameProps, ref: ForwardedRef<IGameHandle>): JSX.Element {
  const { canvasHeight, canvasWidth } = props;

  // Use useMemo to memoize static objects
  const zombie4StartPosition = useMemo<SpritePosition>(() => ({
    leftX: GAME_TUNING.zombieStartLeftX,
    topY: 0,
  }), []);

  const zombie4PositionRef = useRef<SpritePosition>(zombie4StartPosition);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<ICharacterRefMethods>(null);
  const zombie4Ref = useRef<ICharacterRefMethods>(null);
  const animationFrameIndex = useRef<number | undefined>(undefined);
  const zombie4DeathTimeout = useRef<NodeJS.Timeout | null>(null);
  const heroRunTimeoutRef = useRef<number | null>(null);

  // The hero's on-screen x (px). Starts near the left edge and advances right
  // as the hero runs; it is capped at the canvas center, past which running
  // scrolls the world instead. Stored as a SpritePosition because the Hero
  // sprite draws from its positionRef.
  const heroPositionRef = useRef<SpritePosition>({ leftX: GAME_TUNING.heroStartLeftX, topY: 30 });
  const centerX = canvasWidth / 2;

  // Keep the drawn position in sync when the canvas is resized.
  useEffect(() => {
    heroPositionRef.current = {
      ...heroPositionRef.current,
      leftX: Math.min(heroPositionRef.current.leftX, centerX),
    };
  }, [centerX]);
  const [heroFacingLeft, setHeroFacingLeft] = useState(false);
  const [heroLives, setHeroLives] = useState<number>(GAME_TUNING.maxHeroLives);

  const lastZombieHitAtRef = useRef<number>(0);
  const isHeroDeadRef = useRef(false);
  // Whether the zombie is currently within strike range of the hero. Updated
  // every animation frame purely from geometry; read at keystroke time to
  // decide if a typed char is a fight-swing or a run.
  const engagedRef = useRef(false);

  // Restore the persisted level (background theme) so it does not reset to
  // level 1 when the Game remounts (e.g. after a page reload mid-progress).
  const initialLevel = (() => {
    const storedLevel = gameLevelSignal.value;
    return storedLevel != null && storedLevel >= 1 ? Math.min(storedLevel, getLevelCount()) : 1;
  })();
  const [currentLevel, setCurrentLevel] = useState<number>(initialLevel);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [backgroundOffsetX, setBackgroundOffsetX] = useState(0);
  const [isPhraseComplete, setIsPhraseComplete] = useState(false);
  const [isTextScrolling, setIsTextScrolling] = useState(false);
  const [heroAction, setHeroAction] = useState<ActionType>('Idle');
  const [zombie4Action, setZombie4Action] = useState<ActionType>('Walk');
  const textToScroll = "TERMINAL VELOCITY!";
  const [layersState, setLayersState] = useState<IParallaxLayer[]>(() => layers[Math.min(initialLevel - 1, layers.length - 1)] ?? []);

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
    if (isNotNullOrUndefined(timeout)) {
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

  // Land a zombie hit on the hero. Three hits kills the hero, which then
  // restarts the current level (same background, same phrase) fresh.
  const handleHeroHit = useCallback(() => {
    if (isHeroDeadRef.current) return;
    const nextLives = heroLives - 1;
    setHeroLives(nextLives);
    if (nextLives <= 0) {
      isHeroDeadRef.current = true;
      setHeroAction('Death');
      // Restart the level after the death animation plays out.
      zombie4DeathTimeout.current = setTimeout(() => {
        isHeroDeadRef.current = false;
        setHeroLives(GAME_TUNING.maxHeroLives);
        setHeroAction('Idle');
        setZombie4Action('Walk');
        zombie4PositionRef.current = zombie4StartPosition;
        heroPositionRef.current = { ...heroPositionRef.current, leftX: GAME_TUNING.heroStartLeftX };
        setBackgroundOffsetX(0);
        setHeroFacingLeft(false);
        engagedRef.current = false;
        lastZombieHitAtRef.current = 0;
      }, 2500);
    } else {
      setHeroAction('Hurt');
      setTimeout(() => {
        // Return to a neutral idle after being hit; the player re-engages by
        // typing again (the hero is not in a persistent auto-fight).
        setHeroAction(isHeroDeadRef.current ? 'Death' : 'Idle');
      }, 600);
    }
  }, [heroLives, zombie4StartPosition]);

  const updateCharacterAndBackgroundPostion = useCallback((context: CanvasRenderingContext2D): number => {
    context.clearRect(0, 0, canvasWidth, canvasHeight);

    const hero = heroRef.current;
    if (isNotNullOrUndefined(hero)) {
      hero.draw(context, heroPositionRef.current);
    }

    const zombie = zombie4Ref.current;
    if (isNotNullOrUndefined(zombie)) {
      const zombie4Dx = zombie.draw(context, zombie4PositionRef.current);
      // The zombie advances toward the hero on its own walk (dx per frame).
      zombie4PositionRef.current = {
        ...zombie4PositionRef.current,
        leftX: zombie4PositionRef.current.leftX + zombie4Dx
      };
    }
    return 0;
  }, [canvasWidth, canvasHeight]);

  const checkProximityAndSetAction = useCallback(() => {
    if (isHeroDeadRef.current) return;

    const now = performance.now();
    // Gap between the zombie's body right edge and the hero's body left edge.
    const heroHitbox = heroRef.current?.hitbox ?? GAME_TUNING.heroHitbox;
    const zombieHitbox = zombie4Ref.current?.hitbox ?? GAME_TUNING.zombieHitbox;
    const heroBodyLeft = heroPositionRef.current.leftX + heroHitbox.left;
    const zombieBodyRight = zombie4PositionRef.current.leftX + zombieHitbox.left + zombieHitbox.width;
    const bodyGap = heroBodyLeft - zombieBodyRight;

    const engaged = bodyGap <= GAME_TUNING.fightGap;

    // The zombie is the aggressor: proximity drives ITS attack (and the danger),
    // but the hero does NOT auto-fight. Whether the hero swings is decided by
    // the player typing (in handleCommandLineChange). Here we just record the
    // geometry so that keystroke knows if it's a swing (in range) or a run.
    engagedRef.current = engaged;

    if (engaged) {
      if (zombie4Action !== 'Attack') {
        setZombie4Action('Attack');
      }
      // Land a hit on the zombie's tempo while it is in range.
      if (now - lastZombieHitAtRef.current >= GAME_TUNING.hitIntervalMs) {
        lastZombieHitAtRef.current = now;
        handleHeroHit();
      }
    } else {
      if (zombie4Action === 'Attack') {
        setZombie4Action('Walk');
      }
      lastZombieHitAtRef.current = 0;
    }
  }, [zombie4Action, handleHeroHit]);

  const toggleScrollingText = useCallback((show: boolean | null = null) => {
    const nextShow = show === null ? !isTextScrolling : show;
    setIsTextScrolling(nextShow);
  }, [isTextScrolling]);

  const drawScrollingText = useCallback(() => {
    toggleScrollingText(true);
    setTimeout(() => {
      toggleScrollingText(false);
    }, 3000);
  }, [toggleScrollingText]);

  const startAnimationLoop = useCallback((context: CanvasRenderingContext2D) => {
    stopAnimationLoop();

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
  }, [isPhraseComplete, drawScrollingText, updateCharacterAndBackgroundPostion, checkProximityAndSetAction, stopAnimationLoop]);

  // Helpers to flash a transient action (Run or Attack) and revert to Idle.
  const clearRunSwingTimer = useCallback(() => {
    const timeout = heroRunTimeoutRef.current;
    if (isNotNullOrUndefined(timeout)) {
      clearTimeout(timeout);
      heroRunTimeoutRef.current = null;
    }
  }, []);

  const flashActionThenIdle = useCallback(() => {
    heroRunTimeoutRef.current = window.setTimeout(() => {
      setHeroAction('Idle');
      heroRunTimeoutRef.current = null;
    }, GAME_TUNING.fightSwingMs);
  }, [setHeroAction]);

  // A correctly typed character is the hero's engine. While the zombie is out of
  // range the hero RUNS (advancing toward center, then scrolling the world past).
  // Once the zombie is in range, typing is the hero's defense: the player swings
  // (fights) by typing, turning to face the zombie and nudging it back ~5px.
  // Completing the phrase (upstream) is the fatal blow.
  const handleCommandLineChange = useCallback(() => {
    if (isHeroDeadRef.current) return;
    clearRunSwingTimer();

    if (engagedRef.current) {
      // Fighting: turn to face the zombie (on the hero's left) and swing. The
      // swing is the only time the zombie retreats, and only by a few px.
      zombie4PositionRef.current = {
        ...zombie4PositionRef.current,
        leftX: Math.max(
          GAME_TUNING.zombieFloorLeftX,
          zombie4PositionRef.current.leftX - GAME_TUNING.zombiePushBackPx
        )
      };
      setHeroFacingLeft(true);
      setHeroAction('Attack');
    } else {
      // Running: advance the hero right toward the center. Once centered, the
      // same advance scrolls the world (hero stays at center, scenery moves).
      const prev = heroPositionRef.current.leftX;
      const nextOnScreen = Math.min(prev + GAME_TUNING.heroRunStepPx, centerX);
      const moved = nextOnScreen - prev;
      heroPositionRef.current = { ...heroPositionRef.current, leftX: nextOnScreen };

      const scroll = GAME_TUNING.heroRunStepPx - moved;
      if (scroll > 0) {
        setBackgroundOffsetX(b => b + scroll);
        // Scrolling the world pulls the (stationary-in-world) zombie left too.
        zombie4PositionRef.current = {
          ...zombie4PositionRef.current,
          leftX: zombie4PositionRef.current.leftX - scroll,
        };
      }

      setHeroFacingLeft(false);
      setHeroAction('Run');
    }

    flashActionThenIdle();
  }, [
    clearRunSwingTimer,
    flashActionThenIdle,
    centerX,
    setHeroFacingLeft,
    setHeroAction,
    setBackgroundOffsetX,
  ]);

  // Only advance the hero on genuine forward progress — a strictly longer correct
  // prefix. Backspacing (even to a correct shorter prefix) must NOT advance.
  const lastRunCharCountRef = useRef(0);
  useSignalEffect(() => {
    const typed = commandLine.value ?? '';
    const phraseValue = gamePhraseSignal.value?.value;
    if (phraseValue == null || phraseValue === '') return;
    if (typed === '') {
      lastRunCharCountRef.current = 0;
      return;
    }
    const isCorrectPrefix = typed === phraseValue.trim().substring(0, typed.length);
    if (isCorrectPrefix && typed.length > lastRunCharCountRef.current) {
      lastRunCharCountRef.current = typed.length;
      handleCommandLineChange();
    }
  });

  const setupCanvas = useCallback((canvas: HTMLCanvasElement) => {
    const canvasContext = canvas.getContext('2d');
    if (isNotNullOrUndefined(canvasContext)) {
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
    const clampedLevel = setLevelValue !== null && setLevelValue > levelCount ? levelCount : setLevelValue;
    let nextLevel = clampedLevel !== null ? clampedLevel : getLevel() + 1;
    if (nextLevel > levelCount) nextLevel = 0;
    if (nextLevel < 1) nextLevel = 1;
    setLevel(nextLevel);
    setGameLevel(nextLevel);
  }, [setLevel, getLevel]);

  const startGame = useCallback(() => {
    if (isNotNullOrUndefined(context)) {
      startAnimationLoop(context);
    }
    setIsPhraseComplete(false);
  }, [context, startAnimationLoop]);

  const completeGame = useCallback(() => {
    logger.debug('completeGame called.');
    setZombie4ToDeathThenResetPosition();
    triggerConfettiCannon();
    setIsPhraseComplete(true);
  }, [setZombie4ToDeathThenResetPosition, triggerConfettiCannon]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (isNotNullOrUndefined(canvas)) {
      setupCanvas(canvas);
    }

    return () => {
      stopAnimationLoop();
      const timeout = zombie4DeathTimeout.current;
      if (isNotNullOrUndefined(timeout)) {
        clearTimeout(timeout);
      }
    };
  }, [setupCanvas, stopAnimationLoop]);

  useEffect(() => {
    if (isNotNullOrUndefined(context)) {
      startAnimationLoop(context);
    }
    return () => stopAnimationLoop();
  }, [context, startAnimationLoop, stopAnimationLoop]);

  useImperativeHandle(ref, () => ({
    startGame,
    completeGame,
    resetGame: () => {
      isHeroDeadRef.current = false;
      setHeroLives(GAME_TUNING.maxHeroLives);
      setHeroAction('Idle');
      setZombie4Action('Walk');
      zombie4PositionRef.current = zombie4StartPosition;
      heroPositionRef.current = { ...heroPositionRef.current, leftX: GAME_TUNING.heroStartLeftX };
      setBackgroundOffsetX(0);
      engagedRef.current = false;
      setHeroFacingLeft(false);
      lastZombieHitAtRef.current = 0;
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
        flip={heroFacingLeft}
        hitbox={GAME_TUNING.heroHitbox}
      />
      <Zombie4
        ref={zombie4Ref}
        positionRef={zombie4PositionRef}
        currentActionType={zombie4Action}
        scale={1.90}
        hitbox={GAME_TUNING.zombieHitbox}
      />
    </div>
  );
}

export type { IGameHandle, IGameProps };
export const Game = forwardRef(GameFunction);
