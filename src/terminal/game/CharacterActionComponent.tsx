
import React, { useState, useEffect, useRef } from 'react';
import { ActionType } from './types/ActionTypes';
import { BaseCharacter } from './BaseCharacter';
import { SpritePostion } from './types/Position';


interface ICharacterActionComponentProps {
  onReady: (
    draw: (position: SpritePostion) => void,
    setFrameIndex: React.Dispatch<React.SetStateAction<number>>
  ) => void;
  baseCharacter: BaseCharacter;
  currentActionType: ActionType;
  position: { leftX: number; topY: number };
  name?: string;
  onPositionChange: (newPosition: { leftX: number; topY: number }) => void;
};

export const CharacterActionComponent: React.FC<ICharacterActionComponentProps> = (
  props: ICharacterActionComponentProps
) => {
  const [frameIndex, setFrameIndex] = useState(0); // Track the current frame index
  const frameDelay = 100;
  const prevActionRef = useRef<string | null>(null);
  let lastFrameTime = useRef(Date.now());

  // Handle loading the sprite when the action changes
  useEffect(() => {
    if (
      props.currentActionType
    ) {
      let currentAction = props.baseCharacter.getCurrentAction();
      // console.log("Current action:", props.currentActionType);
      // If movement handling is within this component, you can update dx and dy here
      // If not, you can call onMove with actionData.dx and actionAjax.dy

      const newPosition = {
        leftX: props.position.leftX + currentAction.dx,
        topY: props.position.topY + currentAction.dy
      };
      if (newPosition.leftX > 1000) {
        newPosition.leftX = 0;
      }
      props.onPositionChange(newPosition);

      prevActionRef.current = props.currentActionType;
    }
  }, [
    props.currentActionType, props.baseCharacter, frameIndex
  ]);

  useEffect(() => {
    // console.log('CharacterActionComponent useEffect, currentActionType:', props.currentActionType);
    // Call setCurrentAction on baseCharacter to update the action and sprite
    props.baseCharacter.setCurrentActionType(props.currentActionType);
    // After calling setCurrentActionType, update prevActionRef to the new action
    prevActionRef.current = props.currentActionType;
    // Remove props.baseCharacter from the dependencies array if you are sure that
    // it does not change, or it is not relevant for this effect.
  }, [props.currentActionType]);
  // console.log('CharacterActionComponent render, currentActionType:', props.currentActionType);

  useEffect(() => {
    let animationFrameId: number;

    const handleAnimationFrame = () => {
      const now = Date.now();
      const elapsed = now - lastFrameTime.current;

      if (elapsed > frameDelay) {
        const sprite = props.baseCharacter.getSprite(); // Get the current sprite from baseCharacter
        setFrameIndex(prevIndex => {
          // Ensure sprite is not null and has frameCount
          const frameCount = sprite ? sprite.frameCount : 1;
          let newIndex = (prevIndex + 1) % frameCount;
          return newIndex;
        });
        if (frameIndex > sprite.frameCount) {
          console.log("Frame index out of bounds:", frameIndex, sprite.frameCount);
          // setFrameIndex(0);
        }
        lastFrameTime.current = now - (elapsed % frameDelay);
      }

      animationFrameId = requestAnimationFrame(handleAnimationFrame);
    };

    animationFrameId = requestAnimationFrame(handleAnimationFrame);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [setFrameIndex, props.baseCharacter]); // Depend on baseCharacter instead of sprite

  // Draw the character with the current frame index
  useEffect(() => {
    const drawWithCurrentFrameIndex = (
      position: SpritePostion
    ) => {
      props.baseCharacter.draw(frameIndex, position);
    };

    props.onReady(drawWithCurrentFrameIndex, setFrameIndex);
  }, [frameIndex, props.onReady, props.baseCharacter]);

  return null;
};
