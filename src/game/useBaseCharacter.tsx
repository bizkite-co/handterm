// useBaseCharacter.tsx

import { useEffect, useRef, useState } from 'react';
import { Sprite } from './sprites/Sprite';
import { SpriteAnimation } from './types/SpriteTypes';
import { Action, ActionType } from './types/ActionTypes';
import { SpriteManager } from './sprites/SpriteManager';
import { SpritePosition } from './types/Position';

interface BaseCharacterProps {
  currentActionType: ActionType;
  actions: Record<ActionType, Action>;
  name: string;
  scale: number;
}

export const useBaseCharacter = (props: BaseCharacterProps) => {
  const [, setSprite] = useState<Sprite | null>(null);
  const spriteManager = new SpriteManager();
  const previousActionTypeRef = useRef<ActionType>(props.currentActionType);
  const frameIndexRef = useRef<number>(0);
  const spritesRef = useRef<Record<ActionType, Sprite | undefined>>({} as Record<ActionType, Sprite | undefined>);

  const loadSprite = async (actionKey: ActionType, animationData: SpriteAnimation) => {
    const loadedSprite = await spriteManager.loadSprite(animationData);
    if (loadedSprite) {
      // Update the sprites ref with the new loaded sprite
      spritesRef.current[actionKey] = loadedSprite;
      // If the actionKey is still the current action, update the sprite state
      if (actionKey === props.currentActionType) {
        setSprite(loadedSprite);
      }
    }
  };

  const draw = (
    context: CanvasRenderingContext2D,
    positionRef: React.RefObject<SpritePosition>,
    scale: number | null
  ): number => {
    const sprite = spritesRef.current[props.currentActionType];
    const action = props.actions[props.currentActionType];
    const newX = (positionRef.leftX ?? 0) + action.dx;
    incrementFrameIndex();
    // console.log(`${props.name.toLowerCase()} draw: positionRef=${JSON.stringify(positionRef)}, newX=${newX}, action.dx=${action.dx}`);

    if (sprite) {
      sprite.draw(
        context,
        frameIndexRef.current,
        newX,
        positionRef.topY,
        scale ?? props.scale
      );
    }
    return action.dx;
  }

  const loadActions = () => {
    Object.entries(props.actions).forEach(([actionKey, actionData]) => {
      loadSprite(actionKey as ActionType, actionData.animation);
    });
  };

  useEffect(() => {
    loadActions();

    // Did-mount and will-unmount only
    // TODO: Clean up animation frame, etc.
    return () => {

    };
  }, []);

  useEffect(() => {
    // Update the sprite for the current action type
    const currentSprite = spritesRef.current[props.currentActionType];
    if (currentSprite) {
      // If the sprite is already loaded, use it
      setSprite(currentSprite);
    } else {
      // If the sprite is not loaded, load it and update the ref
      loadSprite(props.currentActionType, props.actions[props.currentActionType].animation);
    }
  }, [props.currentActionType, props.actions]);

  useEffect(() => {
    // Set the current action type
    if (props.name.toLocaleLowerCase() === 'hero')
      setCurrentActionType(props.currentActionType);

    // Specify how to clean up after this effect
    return () => {
    };
  }, [props.currentActionType]);

  useEffect(() => {
    const sprite = spritesRef.current[props.currentActionType];
    if (sprite && sprite.frameCount) {
      if (props.currentActionType !== previousActionTypeRef.current) {
        frameIndexRef.current = 0;
      } else {
        incrementFrameIndex();
      }
    }

    // Remember the previous action type for the next call
    previousActionTypeRef.current = props.currentActionType;

    // This effect should run every time the action type changes or the sprite animation needs to be updated
  }, [props.currentActionType, props.actions]);

  const setCurrentActionType = (newActionType: ActionType) => {
    if (props.currentActionType === newActionType) return
    // Update the current action
    props.currentActionType = newActionType;
    frameIndexRef.current = 0;
    // Update the current sprite to match the new action
    const sprite = spritesRef.current[newActionType];
    if (sprite) {
      setSprite(sprite);
    } else {
      console.error(`Sprite not found for action type: ${newActionType}`);
    }
  }

  const incrementFrameIndex = () => {
    const sprite = spritesRef.current[props.currentActionType];
    if (sprite) {
      const nextFrameIndex = (frameIndexRef.current + 1) % sprite.frameCount;
      frameIndexRef.current = nextFrameIndex; // Update the ref's current value
    }
  };


  return {
    draw
  };
};