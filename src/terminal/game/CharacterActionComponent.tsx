
import React, { useState, useEffect, useContext, useRef } from 'react';
import { ActionType } from './ActionTypes';
import SpriteManagerContext from '../SpriteManagerContext';
import { BaseCharacter } from './BaseCharacter';


interface ICharacterActionComponentProps {
  onReady: (
    draw: (context: CanvasRenderingContext2D, position: { leftX: number; topY: number; }) => void,
    setFrameIndex: React.Dispatch<React.SetStateAction<number>>
  ) => void;
  baseCharacter: BaseCharacter;
  currentActionType: ActionType;
  position: { leftX: number; topY: number };
  onPositionChange: (newPosition: { leftX: number; topY: number }) => void;
};

export const CharacterActionComponent: React.FC<ICharacterActionComponentProps> = (
  props: ICharacterActionComponentProps
) => {
  const [frameIndex, setFrameIndex] = useState(0); // Track the current frame index
  const spriteManager = useContext(SpriteManagerContext);
  const frameDelay = 100;
  const prevActionRef = useRef<string | null>(null);
  let lastFrameTime = useRef(Date.now());

  // Handle loading the sprite when the action changes
  useEffect(() => {
    if (spriteManager && props.currentActionType && prevActionRef.current !== props.currentActionType) {
      let currentAction = props.baseCharacter.getCurrentAction();
      // If movement handling is within this component, you can update dx and dy here
      // If not, you can call onMove with actionData.dx and actionData.dy
      const newPosition = {
        leftX: props.position.leftX + currentAction.dx,
        topY: props.position.topY + currentAction.dy
      };
      console.log("Calling onMove", currentAction.dx, currentAction.dy);
      props.onPositionChange(newPosition);

      prevActionRef.current = props.currentActionType;
    }
  }, [
    props.currentActionType, props.baseCharacter, props.position, props.onPositionChange
  ]);

  // CharacterActionComponent.tsx
  useEffect(() => {
    if (props.currentActionType && prevActionRef.current !== props.currentActionType) {
      // Call setCurrentAction on baseCharacter to update the action and sprite
      props.baseCharacter.setCurrentActionType(props.currentActionType);

      // Update the component state to reflect the new action
      prevActionRef.current = props.currentActionType;
    }
  }, [props.currentActionType, props.baseCharacter]);

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
      context: CanvasRenderingContext2D,
      position: { leftX: number, topY: number }
    ) => {
      const sprite = props.baseCharacter.getSprite(); // Get the current sprite from baseCharacter
      if (sprite) {
        // console.log("drawWithCurrentFrameIndex", frameIndex);
        sprite.draw(context, frameIndex, position.leftX, position.topY);
      }
    };

    props.onReady(drawWithCurrentFrameIndex, setFrameIndex);
  }, [frameIndex, props.onReady, props.baseCharacter]);

  return null;
};
