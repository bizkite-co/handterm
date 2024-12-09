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
  const [sprite, setSprite] = useState<Sprite | null>(null);
  const spriteManager = useMemo(() => new SpriteManager(), []);
  const frameIndexRef = useRef<number>(0);
  const currentActionRef = useRef<ActionType>(props.currentActionType);

  // Initialize spritesRef with undefined values for all action types
  const spritesRef = useRef<Record<ActionType, Sprite | undefined>>(
    Object.keys(props.actions).reduce((acc, key) => ({
      ...acc,
      [key]: undefined
    }), {} as Record<ActionType, Sprite | undefined>)
  );

  const { currentActionType, actions, name } = props;

  const loadSprite = useCallback(async (actionKey: ActionType, animationData: SpriteAnimation) => {
    const loadedSprite = await spriteManager.loadSprite(animationData);
    if (loadedSprite) {
      spritesRef.current[actionKey] = loadedSprite;
      if (actionKey === currentActionRef.current) {
        setSprite(loadedSprite);
      }
    }
  }, [spriteManager]);

  const setCurrentActionType = useCallback((newActionType: ActionType) => {
    if (currentActionRef.current === newActionType) return;

    // Update both the ref and the prop
    currentActionRef.current = newActionType;
    props.currentActionType = newActionType;
    frameIndexRef.current = 0;

    const sprite = spritesRef.current[newActionType];
    if (sprite) {
      setSprite(sprite);
    } else {
      // Try to load the sprite if it's missing
      loadSprite(newActionType, actions[newActionType].animation);
    }
  }, [actions, loadSprite]);

  const draw = (
    context: CanvasRenderingContext2D,
    positionRef: React.RefObject<SpritePosition>,
    scale: number | null
  ): number => {
    const sprite = spritesRef.current[currentActionRef.current];
    const action = actions[currentActionRef.current];
    const newX = (positionRef?.current?.leftX ?? 0) + action.dx;

    if (sprite) {
      const nextFrameIndex = (frameIndexRef.current + 1) % sprite.frameCount;
      frameIndexRef.current = nextFrameIndex;

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

  // Load all sprites on mount
  useEffect(() => {
    Object.entries(actions).forEach(([actionKey, actionData]) => {
      loadSprite(actionKey as ActionType, actionData.animation);
    });

    return () => {
      // Clear sprite references on unmount
      spritesRef.current = Object.keys(actions).reduce((acc, key) => ({
        ...acc,
        [key]: undefined
      }), {} as Record<ActionType, Sprite | undefined>);
      setSprite(null);
    };
  }, [actions, loadSprite]);

  // Handle prop changes for currentActionType
  useEffect(() => {
    if (currentActionType !== currentActionRef.current) {
      setCurrentActionType(currentActionType);
    }
  }, [currentActionType, setCurrentActionType]);

  // Handle initial sprite loading for current action
  useEffect(() => {
    const currentSprite = spritesRef.current[currentActionRef.current];
    if (!currentSprite) {
      loadSprite(currentActionRef.current, actions[currentActionRef.current].animation);
    }
  }, [currentActionRef.current, actions, loadSprite]);

  return {
    draw,
    setCurrentActionType  // Export this so parent components can trigger action changes
  };
};
