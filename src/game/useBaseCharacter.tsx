// useBaseCharacter.tsx

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Sprite } from './sprites/Sprite';
import { SpriteAnimation } from './types/SpriteTypes';
import { Action, ActionType } from './types/ActionTypes';
import { SpriteManager } from './sprites/SpriteManager';
import { SpritePosition } from './types/Position';
import { createLogger, LogLevel } from 'src/utils/Logger';

const logger = createLogger({
  prefix: 'BaseCharacter',
  level: LogLevel.ERROR
});

interface BaseCharacterProps {
  currentActionType: ActionType;
  actions: Record<ActionType, Action>;
  name: string;
  scale: number;
  positionRef: React.RefObject<SpritePosition>;
}

export const useBaseCharacter = (props: BaseCharacterProps) => {
  const [, setSprite] = useState<Sprite | null>(null);

  // Memoize spriteManager to prevent recreation on each render
  const spriteManager = useMemo(() => new SpriteManager(), []);

  const previousActionTypeRef = useRef<ActionType>(props.currentActionType);
  const frameIndexRef = useRef<number>(0);
  const spritesRef = useRef<Record<ActionType, Sprite | undefined>>({} as Record<ActionType, Sprite | undefined>);

  // Destructure props to use in useCallback dependencies
  const { currentActionType, actions, name } = props;

  const loadSprite = useCallback(async (actionKey: ActionType, animationData: SpriteAnimation) => {
    const loadedSprite = await spriteManager.loadSprite(animationData);
    if (loadedSprite) {
      // Update the sprites ref with the new loaded sprite
      spritesRef.current[actionKey] = loadedSprite;
      // If the actionKey is still the current action, update the sprite state
      if (actionKey === currentActionType) {
        setSprite(loadedSprite);
      }
    }
  }, [currentActionType, spriteManager]);

  const draw = (
    context: CanvasRenderingContext2D,
    positionRef: React.RefObject<SpritePosition>,
    scale: number | null
  ): number => {
    const sprite = spritesRef.current[currentActionType];
    const action = actions[currentActionType];
    const newX = (positionRef?.current?.leftX ?? 0) + action.dx;

    incrementFrameIndex();

    if (sprite) {
      sprite.draw(
        context,
        frameIndexRef.current,
        newX,
        positionRef?.current?.topY ?? 0,
        scale ?? props.scale
      );
    }
    return action.dx;
  }

  const loadActions = useCallback(() => {
    Object.entries(actions).forEach(([actionKey, actionData]) => {
      loadSprite(actionKey as ActionType, actionData.animation);
    });
  }, [actions, loadSprite]);

  useEffect(() => {
    loadActions();

    // Did-mount and will-unmount only
    // TODO: Clean up animation frame, etc.
    return () => {
      // Cleanup logic can be added here if needed
    };
  }, [loadActions]);

  const setCurrentActionType = useCallback((newActionType: ActionType) => {
    if (currentActionType === newActionType) return;
    // Update the current action
    props.currentActionType = newActionType;
    frameIndexRef.current = 0;
    // Update the current sprite to match the new action
    const sprite = spritesRef.current[newActionType];
    if (sprite) {
      setSprite(sprite);
    } else {
      logger.error(`Sprite not found for action type: ${newActionType}`);
    }
  }, [currentActionType, props]);

  const incrementFrameIndex = useCallback(() => {
    const sprite = spritesRef.current[currentActionType];
    if (sprite) {
      const nextFrameIndex = (frameIndexRef.current + 1) % sprite.frameCount;
      frameIndexRef.current = nextFrameIndex; // Update the ref's current value
    }
  }, [currentActionType]);

  useEffect(() => {
    // Update the sprite for the current action type
    const currentSprite = spritesRef.current[currentActionType];
    if (currentSprite) {
      // If the sprite is already loaded, use it
      setSprite(currentSprite);
    } else {
      // If the sprite is not loaded, load it and update the ref
      loadSprite(currentActionType, actions[currentActionType].animation);
    }
  }, [currentActionType, actions, loadSprite]);

  useEffect(() => {
    // Set the current action type
    if (name.toLocaleLowerCase() === 'hero')
      setCurrentActionType(currentActionType);

    // Specify how to clean up after this effect
    return () => {
      // Cleanup logic can be added here if needed
    };
  }, [currentActionType, name, setCurrentActionType]);

  useEffect(() => {
    const sprite = spritesRef.current[currentActionType];
    if (sprite && sprite.frameCount) {
      if (currentActionType !== previousActionTypeRef.current) {
        frameIndexRef.current = 0;
      } else {
        incrementFrameIndex();
      }
    }

    // Remember the previous action type for the next call
    previousActionTypeRef.current = currentActionType;

    // This effect should run every time the action type changes or the sprite animation needs to be updated
  }, [currentActionType, actions, incrementFrameIndex]);

  return {
    draw
  };
};
