
import React, { useState, useEffect } from 'react';
import { Sprite } from './sprites/Sprite';
import { Actions, AnimationKey } from './CharacterActions';

type CharacterActionComponentProps = {
  initialAction: AnimationKey;
  position: { leftX: number; topY: number };
  // Other props such as onActionComplete callback, etc.
};

const CharacterActionComponent: React.FC<CharacterActionComponentProps> = ({
  initialAction,
  position,
  // ...otherProps
}) => {
  const [currentAction, setCurrentAction] = useState<AnimationKey>(initialAction);
  const [sprite, setSprite] = useState<Sprite | null>(null);

  // Initialize the sprite based on the current action
  useEffect(() => {
    const action = Actions[currentAction];
    const newSprite = new Sprite(
      action.animation.imagePath,
      action.animation.frameCount,
      action.animation.frameWidth,
      action.animation.frameHeight,
      action.animation.framePositions
    );
    setSprite(newSprite);
    // You might need to handle cleanup as well if the component unmounts
  }, [currentAction]);

  // Handle rendering the sprite based on the current action and position
  const renderSprite = () => {
    if (sprite) {
      // The actual rendering logic goes here
      // For example, using canvas context to draw the sprite
      // ctx.drawImage(...) based on the sprite and frameIndex
    }
  };

  // Handle periodically changing the action, for example, based on position
  useEffect(() => {
    const attackEvery = 60;
    const newAction = position.leftX % attackEvery === 0 ? 'Attack' : 'Walk';
    setCurrentAction(newAction);
  }, [position]);

  // Call renderSprite on each animation frame or when necessary
  useEffect(() => {
    const animationFrameId = requestAnimationFrame(renderSprite);
    return () => cancelAnimationFrame(animationFrameId);
  }, [renderSprite]);

  return (
    <div>
      {/* Render your character and animations here, if using a DOM-based approach */}
    </div>
  );
};

export default CharacterActionComponent;