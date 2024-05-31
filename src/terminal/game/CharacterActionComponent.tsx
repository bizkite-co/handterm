
import React, { useState, useEffect, useContext } from 'react';
import { Actions, AnimationKey } from './CharacterActions';
import SpriteManagerContext from '../SpriteManagerContext';
import { Sprite } from './sprites/Sprite';


type CharacterActionComponentProps = {
  initialAction: AnimationKey;
  position: { leftX: number; topY: number };
  // Other props such as onActionComplete callback, etc.
};

export const CharacterActionComponent: React.FC<CharacterActionComponentProps> = ({
  initialAction,
  position,
  // ...otherProps
}) => {
  const [currentAction, setCurrentAction] = useState<AnimationKey>(initialAction);
  const [characterPosition, setCharacterPosition] = useState(position);
  const [sprite, setSprite] = useState<Sprite | null>(null); // Define sprite state here

  const spriteManager = useContext(SpriteManagerContext); // Assuming SpriteManager is provided in the context
  // Immediately throw an error if spriteManager is undefined to prevent further execution
  if (!spriteManager) {
    throw new Error('SpriteManagerContext.Provider is missing in the component tree.');
  }
  // Load sprite for the current action
  useEffect(() => {
    const action = Actions[currentAction];
    spriteManager.loadSprite(action.animation).then((loadedSprite) => {
      setSprite(loadedSprite);
      // Render the sprite using the sprite instance
      // Update character position based on dx and dy
      setCharacterPosition({
        leftX: characterPosition.leftX + action.dx,
        topY: characterPosition.topY + action.dy
      });
    });
  }, [currentAction, spriteManager, characterPosition]);

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
