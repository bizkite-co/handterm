
import React, { useState, useEffect, useContext } from 'react';
import { Actions, AnimationKey } from './CharacterActions';
import SpriteManagerContext from '../SpriteManagerContext';
import { Sprite } from './sprites/Sprite';


interface ICharacterActionComponentProps {
  action: AnimationKey;
  position: { leftX: number; topY: number };
  context: CanvasRenderingContext2D | null;
  // Other props such as onActionComplete callback, etc.
};

export const CharacterActionComponent: React.FC<ICharacterActionComponentProps> = (props: ICharacterActionComponentProps) => {
  const [currentAction, setCurrentAction] = useState<AnimationKey>(props.action);
  const [characterPosition, setCharacterPosition] = useState(props.position);
  const [sprite, setSprite] = useState<Sprite | null>(null); // Define sprite state here
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [lastFrameTime, setLastFrameTime] = useState(Date.now());

  const offscreenCanvas = document.createElement('canvas');
  if (props.context) {
    offscreenCanvas.width = props.context.canvas.width;
    offscreenCanvas.height = props.context.canvas.height;
  }
  const offscreenCtx = offscreenCanvas.getContext('2d');

  const frameDelay = 100; // Adjust frame delay for animation speed

  const spriteManager = useContext(SpriteManagerContext); // Assuming SpriteManager is provided in the context
  // Immediately throw an error if spriteManager is undefined to prevent further execution
  if (!spriteManager) {
    throw new Error('SpriteManagerContext.Provider is missing in the component tree.');
  }

  // Load and update the sprite based on the current action
  useEffect(() => {
    const actionData = Actions[currentAction];
    spriteManager.loadSprite(actionData.animation).then((loadedSprite) => {
      setSprite(loadedSprite);
      // You may want to reset the frame index here
    });
  }, [currentAction]);

  // Handle rendering the sprite based on the current action and position
  const renderSprite = (offscreenCtx: CanvasRenderingContext2D, visibleCtx: CanvasRenderingContext2D, frameIndex: number, sprite: Sprite, position: { leftX: number; topY: number }) => {
    const now = Date.now();
    const newFrameIndex = sprite.updateFrameIndex(frameIndex, now, lastFrameTime, frameDelay);

    // Update frame index and last frame time if necessary
    if (newFrameIndex !== frameIndex) {
      setCurrentFrameIndex(newFrameIndex);
      setLastFrameTime(now);
    }

    // Draw the current frame of the sprite
    // Draw your sprite on the off-screen canvas
    sprite.draw(offscreenCtx, newFrameIndex, position.leftX, position.topY);

    // Now draw the off-screen canvas to the visible canvas
    visibleCtx.clearRect(0, 0, visibleCtx.canvas.width, visibleCtx.canvas.height);
    visibleCtx.drawImage(offscreenCanvas, 0, 0);
  };

  useEffect(() => {
    if (!props.context || !sprite) {
      return;
    }

    let animationFrameId: number;

    // Define the animation loop function
    const loop = () => {
      if (props.context && offscreenCtx) renderSprite(offscreenCtx, props.context, currentFrameIndex, sprite, props.position);
      animationFrameId = requestAnimationFrame(loop);
    };

    // Start the animation loop
    animationFrameId = requestAnimationFrame(loop);

    // Cleanup function to cancel the animation frame when the component unmounts or dependencies change
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [props.context, currentFrameIndex, lastFrameTime, sprite, props.position]);

  return (
    <div>
      {/* Render your character and animations here, if using a DOM-based approach */}
    </div>
  );
};
