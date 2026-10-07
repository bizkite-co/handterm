// TerminalGame.ts
import { useState, useEffect, useRef, useImperativeHandle, useCallback, useMemo, forwardRef, type ForwardedRef, type JSX } from 'react';

import confetti from 'canvas-confetti';

import { useComputed, useSignalEffect } from "@preact/signals-react";

import { ActivityType } from "@handterm/types";
import { commandLineSignal } from "../signals/commandLineSignals";
import { isInGameModeSignal, gamePhraseSignal, gameLevelSignal, setGameLevel } from '../signals/gameSignals';
import { createLogger, LogLevel } from '../utils/Logger';
import { isNotNullOrUndefined } from '../utils/typeSafetyUtils';
import { navigate } from '../utils/navigationUtils';

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
  // The hero advances continuously while the Run animation plays (per ~150ms
  // animation frame, not per keystroke) so movement and scroll are smooth.
  // Before center the advance moves the hero right; once centered it scrolls
  // the world instead. The zombie is NOT pulled left by the scroll — it keeps
  // walking right and can always catch up to engage.
  heroRunDxPerFrame: 4,

  // Contact / combat. Engagement uses hysteresis so the duel is stable: once
  // the zombie closes to fightGap it stays engaged (holding its ground — no
  // forward recovery competing with the player's push) until it is knocked a
  // full disengageGap back, at which point it walks forward and re-engages.
  fightGap: 2,             // body-gap (px) at which the zombie becomes engaged
  disengageGap: 36,        // body-gap (px) at which the zombie breaks off the duel
  maxHeroLives: 3,         // hits to kill the hero (then game over)
  fightSwingMs: 800,       // how long a player-initiated swing / run flash lasts

  // Danger when the player idles in range: the zombie does NOT auto-fight, but
  // if the player stops typing for this long while the zombie is engaged, a
  // swipe lands (then repeats every zombieHitCooldownMs until the player
  // resumes striking or the zombie is pushed out of range).
  idleDamageAfterMs: 1500,
  zombieHitCooldownMs: 1200,

  // Defensive typing.
  zombiePushBackPx: 3,     // ONLY when the player swings: px the zombie retreats
  zombieFloorLeftX: -130,  // retreat floor — zombie never goes far off the left edge

  // Body footprints (relative to logical leftX).
  // Lucia's 579px cell renders ~75px wide at scale 0.13; the hitbox is the
  // torso footprint (centered ~x+38) where contact with the zombie is judged.
  heroHitbox: { left: 22, width: 32 },    // torso of Lucia's cell @0.13
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
  // Last time the player struck (typed a correct char while the zombie was in
  // range). Used to land idle-danger: if the player stops striking long enough
  // while the zombie is in range, the zombie swipes the hero.
  const lastStrikeAtRef = useRef<number>(0);
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
  // Mirror of heroAction for the animation loop, which must read the current
  // action without the loop being torn down/restarted on every keystroke.
  const heroActionRef = useRef<ActionType>('Idle');
  useEffect(() => {
    heroActionRef.current = heroAction;
  }, [heroAction]);
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

  // Land a zombie hit on the hero. Three hits (idle-danger swipes) kill the
  // hero, which is a GAME OVER — we leave the level rather than re-fighting it.
  // The zombie is only ever sent back to the start when it is defeated (phrase
  // completion -> level change), never from a losing fight.
  const handleHeroHit = useCallback(() => {
    if (isHeroDeadRef.current) return;
    const nextLives = heroLives - 1;
    setHeroLives(nextLives);
    if (nextLives <= 0) {
      isHeroDeadRef.current = true;
      setHeroAction('Death');
      // Game over: after the death animation plays, exit to the terminal. The
      // player can `play` again, which is a fresh run (a respawn only ever
      // comes from defeating the zombie by finishing the phrase).
      zombie4DeathTimeout.current = setTimeout(() => {
        zombie4DeathTimeout.current = null;
        commandLineSignal.value = '';
        void navigate({ activityKey: ActivityType.NORMAL });
      }, 2500);
    } else {
      setHeroAction('Hurt');
      setTimeout(() => {
        // Return to a neutral idle after being hit; the player re-engages by
        // typing again (the hero is not in a persistent auto-fight).
        setHeroAction(isHeroDeadRef.current ? 'Death' : 'Idle');
      }, 600);
    }
  }, [heroLives]);

  const updateCharacterAndBackgroundPostion = useCallback((context: CanvasRenderingContext2D): number => {
    context.clearRect(0, 0, canvasWidth, canvasHeight);

    const hero = heroRef.current;
    if (isNotNullOrUndefined(hero)) {
      hero.draw(context, heroPositionRef.current);
    }

    // While the Run action is active the hero advances a little each frame
    // (not per-keystroke) so movement and world-scroll are smooth. Before the
    // center the hero moves right on screen; once centered the same step scrolls
    // the world instead. Scrolling moves the WHOLE background frame, so the
    // zombie (stationary in world terms) is dragged left by the exact same
    // amount — it keeps walking forward along the background, but the hero is
    // genuinely outrunning it, which is what makes running worthwhile.
    if (heroActionRef.current === 'Run' && !engagedRef.current && !isHeroDeadRef.current) {
      const { leftX } = heroPositionRef.current;
      const scroll = Math.max(0, leftX + GAME_TUNING.heroRunDxPerFrame - centerX);
      heroPositionRef.current = {
        ...heroPositionRef.current,
        leftX: Math.min(leftX + GAME_TUNING.heroRunDxPerFrame, centerX),
      };
      if (scroll > 0) {
        setBackgroundOffsetX(b => b + scroll);
        // The zombie's motion is always in the background reference frame:
        // scroll the background and the zombie together, so the hero's run
        // actually opens distance instead of the zombie moving with the hero.
        zombie4PositionRef.current = {
          ...zombie4PositionRef.current,
          leftX: zombie4PositionRef.current.leftX - scroll,
        };
      }
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
  }, [canvasWidth, canvasHeight, centerX]);

  const checkProximityAndSetAction = useCallback(() => {
    if (isHeroDeadRef.current) return;

    const now = performance.now();
    // Gap between the zombie's body right edge and the hero's body left edge.
    const heroHitbox = heroRef.current?.hitbox ?? GAME_TUNING.heroHitbox;
    const zombieHitbox = zombie4Ref.current?.hitbox ?? GAME_TUNING.zombieHitbox;
    const heroBodyLeft = heroPositionRef.current.leftX + heroHitbox.left;
    const zombieBodyRight = zombie4PositionRef.current.leftX + zombieHitbox.left + zombieHitbox.width;
    const bodyGap = heroBodyLeft - zombieBodyRight;

    let engaged = engagedRef.current;
    if (engaged) {
      // Break off the duel only when pushed a full disengageGap back. Until
      // then the zombie holds its ground (Attack, dx=0) so each player strike
      // visibly moves it back instead of it re-walking forward every frame.
      if (bodyGap >= GAME_TUNING.disengageGap) {
        engaged = false;
      }
    } else if (bodyGap <= GAME_TUNING.fightGap) {
      engaged = true;
    }
    engagedRef.current = engaged;

    // The hero always faces the zombie while it is on screen, EXCEPT while
    // running (the hero always runs to the right).
    const heroRunning = heroActionRef.current === 'Run';
    const zombieOnScreen = zombieBodyRight > 0 && heroBodyLeft < canvasWidth;
    setHeroFacingLeft(zombieOnScreen && !heroRunning);

    // The zombie is the aggressor: proximity drives ITS attack (and the danger);
    // but the hero does NOT auto-fight — it only swings when the player types
    // (in handleCommandLineChange). Recording the geometry here lets a keystroke
    // know whether it's a swing (engaged) or a run.
    if (engaged) {
      if (zombie4Action !== 'Attack') {
        setZombie4Action('Attack');
      }
      // Danger only if the PLAYER has been idle (not striking) for too long
      // while the zombie is in range. Repeated swipes are throttled so the
      // whole life bar doesn't drain in a single frame.
      const idleSinceStrike = now - lastStrikeAtRef.current;
      if (
        idleSinceStrike >= GAME_TUNING.idleDamageAfterMs &&
        now - lastZombieHitAtRef.current >= GAME_TUNING.zombieHitCooldownMs
      ) {
        lastZombieHitAtRef.current = now;
        handleHeroHit();
      }
    } else {
      if (zombie4Action === 'Attack') {
        setZombie4Action('Walk');
      }
      lastZombieHitAtRef.current = 0;
    }
  }, [zombie4Action, handleHeroHit, setHeroFacingLeft, canvasWidth]);

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
  // (fights) by typing, turning to face the zombie and nudging it back 3px.
  // Completing the phrase (upstream) is the fatal blow.
  const handleCommandLineChange = useCallback(() => {
    if (isHeroDeadRef.current) return;
    clearRunSwingTimer();

    if (engagedRef.current) {
      // Fighting: turn to face the zombie (on the hero's left) and swing. The
      // swing is the only time the zombie retreats, and only by 3px. Recording
      // the strike time also resets the idle-danger clock so the zombie won't
      // swipe as long as the player keeps striking.
      zombie4PositionRef.current = {
        ...zombie4PositionRef.current,
        leftX: Math.max(
          GAME_TUNING.zombieFloorLeftX,
          zombie4PositionRef.current.leftX - GAME_TUNING.zombiePushBackPx
        )
      };
      lastStrikeAtRef.current = performance.now();
      setHeroFacingLeft(true);
      setHeroAction('Attack');
    } else {
      // Running: set the Run action and face right. Actual on-screen advance
      // (toward center) and then world-scroll happen in the animation loop so
      // the movement is smooth instead of a per-keystroke jump.
      setHeroFacingLeft(false);
      setHeroAction('Run');
    }

    flashActionThenIdle();
  }, [
    clearRunSwingTimer,
    flashActionThenIdle,
    setHeroFacingLeft,
    setHeroAction,
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
      lastStrikeAtRef.current = 0;
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
        scale={0.13}
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
